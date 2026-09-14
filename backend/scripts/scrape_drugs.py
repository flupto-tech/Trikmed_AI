from __future__ import annotations

import argparse
import asyncio
import json
import logging
import random
import re
import urllib.robotparser
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "drug_validation" / "data"
RAW_DRUGS_PATH = DATA_DIR / "raw_scraped_drugs.json"
BASE_URL = "https://www.1mg.com"

# Metrics
metrics = {
    "TOTAL_URLS_DISCOVERED": 0,
    "TOTAL_PAGES_FETCHED": 0,
    "TOTAL_PRODUCT_PAGES": 0,
    "TOTAL_VALID_DRUG_RECORDS": 0,
    "TOTAL_DUPLICATES_REMOVED": 0,
    "TOTAL_INVALID_RECORDS": 0,
    "TOTAL_RECORDS_WITH_BRAND": 0,
    "TOTAL_RECORDS_WITH_GENERIC": 0,
    "TOTAL_RECORDS_WITH_STRENGTH": 0,
    "TOTAL_RECORDS_WITH_FORM": 0,
    "TOTAL_RECORDS_WITH_SOURCE_URL": 0,
    "TOTAL_FAILED_PAGES": 0,
}

def can_fetch(url: str, user_agent: str) -> bool:
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(f"{BASE_URL}/robots.txt")
    try:
        rp.read()
        return rp.can_fetch(user_agent, url)
    except Exception:
        return True

async def fetch_sitemap_urls(client: httpx.AsyncClient, sitemap_url: str) -> set[str]:
    urls = set()
    try:
        resp = await client.get(sitemap_url, timeout=30.0)
        if resp.is_success:
            root = ET.fromstring(resp.text)
            for child in root:
                tag = child.tag.lower()
                loc = child.find("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
                if loc is None:
                    loc = child.find("loc")
                
                if loc is not None and loc.text:
                    if "sitemap" in tag and "index" in tag:
                        sub_urls = await fetch_sitemap_urls(client, loc.text)
                        urls.update(sub_urls)
                    elif "/drugs/" in loc.text:
                        urls.add(loc.text)
    except Exception as e:
        logger.warning(f"Failed to fetch sitemap {sitemap_url}: {e}")
    return urls

async def discover_urls_from_sitemap() -> list[str]:
    logger.info("Attempting genuine sitemap discovery...")
    headers = {"User-Agent": "Mozilla/5.0"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        urls = await fetch_sitemap_urls(client, f"{BASE_URL}/sitemap.xml")
    
    if not urls:
        logger.info("Sitemap discovery failed/empty. Falling back to category crawling.")
        urls = set()
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            for letter in ['a', 'b', 'c']:
                page = 1
                while page <= 3:
                    url = f"{BASE_URL}/drugs-all-medicines?label={letter}&page={page}"
                    try:
                        resp = await client.get(url)
                        if resp.is_success:
                            soup = BeautifulSoup(resp.text, "html.parser")
                            links = soup.find_all("a", href=re.compile(r"^/drugs/"))
                            for link in links:
                                full = f"{BASE_URL}{link['href']}" if link['href'].startswith('/') else link['href']
                                urls.add(full)
                    except Exception:
                        break
                    page += 1
                    await asyncio.sleep(0.5)
    
    metrics["TOTAL_URLS_DISCOVERED"] = len(urls)
    return list(urls)

async def extract_drug_info(url: str, client: httpx.AsyncClient) -> dict[str, Any] | None:
    headers = {"User-Agent": "Mozilla/5.0"}
    if not can_fetch(url, headers["User-Agent"]):
        return None

    try:
        metrics["TOTAL_PAGES_FETCHED"] += 1
        resp = await client.get(url, headers=headers)
        if not resp.is_success:
            metrics["TOTAL_FAILED_PAGES"] += 1
            return None

        metrics["TOTAL_PRODUCT_PAGES"] += 1
        soup = BeautifulSoup(resp.text, "html.parser")
        
        title = soup.find("h1")
        brand = title.text.strip() if title else ""
        
        generic_elem = soup.find("a", href=re.compile(r"/generics/"))
        generic = generic_elem.text.strip() if generic_elem else ""
        
        manufacturer_elem = soup.find(text=re.compile(r"Manufacturer|Marketer", re.I))
        manufacturer = manufacturer_elem.find_next("a").text.strip() if manufacturer_elem and manufacturer_elem.find_next("a") else ""

        strength_match = re.search(r"(\d+(\.\d+)?\s*(mg|mcg|ml|g|%))", brand, re.I)
        strength = strength_match.group(1).lower() if strength_match else ""

        brand_lower = brand.lower()
        form = "Tablet"
        if "syrup" in brand_lower: form = "Syrup"
        elif "injection" in brand_lower: form = "Injection"
        elif "capsule" in brand_lower: form = "Capsule"
        elif "suspension" in brand_lower: form = "Suspension"
        elif "cream" in brand_lower: form = "Cream"
        elif "ointment" in brand_lower: form = "Ointment"
        elif "drops" in brand_lower: form = "Drops"
        
        if not brand and not generic:
            metrics["TOTAL_INVALID_RECORDS"] += 1
            return None

        metrics["TOTAL_VALID_DRUG_RECORDS"] += 1
        if brand: metrics["TOTAL_RECORDS_WITH_BRAND"] += 1
        if generic: metrics["TOTAL_RECORDS_WITH_GENERIC"] += 1
        if strength: metrics["TOTAL_RECORDS_WITH_STRENGTH"] += 1
        if form: metrics["TOTAL_RECORDS_WITH_FORM"] += 1
        metrics["TOTAL_RECORDS_WITH_SOURCE_URL"] += 1

        return {
            "brand_name": brand,
            "generic_name": generic,
            "manufacturer": manufacturer,
            "strength": strength,
            "form": form,
            "category": "Allopathic",
            "url": url
        }
    except Exception as e:
        logger.error(f"Error extracting from {url}: {e}")
        metrics["TOTAL_FAILED_PAGES"] += 1
        return None

def deduplicate_drugs(drugs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    unique = []
    initial_len = len(drugs)
    for d in drugs:
        key = (
            d.get("brand_name", "").lower(),
            d.get("generic_name", "").lower(),
            d.get("strength", "").lower(),
            d.get("form", "").lower(),
            d.get("manufacturer", "").lower()
        )
        if key not in seen:
            seen.add(key)
            unique.append(d)
    
    metrics["TOTAL_DUPLICATES_REMOVED"] = initial_len - len(unique)
    return unique

def print_ingestion_report():
    print("\n--- INGESTION REPORT ---")
    for k, v in metrics.items():
        print(f"{k}: {v}")
    print("------------------------\n")

async def scrape_pipeline(max_pages: int = 50):
    urls = await discover_urls_from_sitemap()
        
    urls_to_scrape = urls[:max_pages] if max_pages > 0 else urls
    logger.info(f"Starting extraction for {len(urls_to_scrape)} URLs")
    
    results = []
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        for i, url in enumerate(urls_to_scrape):
            data = await extract_drug_info(url, client)
            if data:
                results.append(data)
            await asyncio.sleep(1.0 + random.uniform(0.1, 0.5))

    unique_results = deduplicate_drugs(results)
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(RAW_DRUGS_PATH, "w", encoding="utf-8") as f:
        json.dump(unique_results, f, indent=2, ensure_ascii=False)
    
    print_ingestion_report()
    logger.info(f"Scraping complete. Saved {len(unique_results)} unique records.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-pages", type=int, default=10)
    args = parser.parse_args()
    
    asyncio.run(scrape_pipeline(max_pages=args.max_pages))
