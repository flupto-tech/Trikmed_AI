from __future__ import annotations

import os
import logging
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                # Ensure the same model is used everywhere
                model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
                logger.info(f"Loading embedding model: {model_name}")
                self._model = SentenceTransformer(model_name)
                logger.info("Embedding model loaded successfully.")
            except ImportError:
                logger.error("sentence-transformers not installed. Embeddings disabled.")
                raise RuntimeError("sentence-transformers required for embeddings")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise

    def get_embedding(self, text: str) -> List[float]:
        if not text:
            return []
        self._load_model()
        # SentenceTransformer returns numpy array, convert to list
        embedding = self._model.encode(text).tolist()
        return embedding

embedding_service = EmbeddingService()
