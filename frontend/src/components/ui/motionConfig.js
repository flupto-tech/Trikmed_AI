'use client'

export const MOTION_EASE_OUT = [0.22, 1, 0.36, 1]
export const MOTION_EASE_IN_OUT = [0.4, 0, 0.2, 1]

export function pageTransition(reduceMotion) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 },
    transition: { duration: reduceMotion ? 0.08 : 0.24, ease: MOTION_EASE_OUT },
  }
}

export function fadeUpTransition(reduceMotion, delay = 0) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 },
    transition: { duration: reduceMotion ? 0.08 : 0.24, ease: MOTION_EASE_OUT, delay: reduceMotion ? 0 : delay },
  }
}

export function modalBackdropTransition(reduceMotion) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduceMotion ? 0.08 : 0.2, ease: MOTION_EASE_OUT },
  }
}

export function modalPanelTransition(reduceMotion) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 },
    transition: { duration: reduceMotion ? 0.08 : 0.24, ease: MOTION_EASE_OUT },
  }
}

export function drawerPanelTransition(position, reduceMotion) {
  const initial = position === 'left' ? { x: '-100%' } : position === 'bottom' ? { y: '100%' } : { x: '100%' }
  return {
    initial: reduceMotion ? { opacity: 0 } : initial,
    animate: reduceMotion ? { opacity: 1 } : { x: 0, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : initial,
    transition: { duration: reduceMotion ? 0.08 : 0.28, ease: MOTION_EASE_OUT },
  }
}
