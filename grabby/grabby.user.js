// ==UserScript==
// @name         Grabby
// @namespace    https://github.com/folktroll/userscripts/grabby
// @version      26.2.23.1015
// @description  Shift+C = grab + escalate + copy | Shift+X = full reset
// @author       You
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict'

  const MAX_GRABS = 5
  let count = 0
  let lastEl = null
  let lastLen = -1
  let resetTimer = null
  let popupTimer = null
  let mx = 0, my = 0

  const activeEls = new Set()

  const getVisibleText = el => {
    if (!el) return '';

    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return '';
        if (node.classList.contains('visually-hidden') || node.classList.contains('sr-only')) return '';
      }

      if (node.nodeType === Node.TEXT_NODE) return node.textContent;

      let text = '';
      node.childNodes.forEach(child => {
        const childText = walk(child);
        if (childText !== undefined && childText !== null) {
          const isBlock = ['DIV', 'P', 'BR', 'LI', 'H1', 'H2', 'H3'].includes(child.tagName);
          text += isBlock ? `\n${childText}\n` : childText;
        }
      });

      return text;
    };

    return walk(el).split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
   }

  const isInNewContext = (oldEl, newEl) => {
    if (!oldEl || oldEl === newEl) return false;

    let common = oldEl.parentElement;
    while (common && !common.contains(newEl)) {
      common = common.parentElement;
    }

    if (!common || ['BODY', 'HTML'].includes(common.tagName)) return true;

    let stepsUp = 0;
    let tempUp = oldEl;
    while (tempUp && tempUp !== common) {
      tempUp = tempUp.parentElement;
      stepsUp++;
    }

    if (stepsUp > 5) return true;

    if (oldEl.contains(newEl)) {
      let downDistance = 0;
      let tempDown = newEl;
      while (tempDown && tempDown !== oldEl) {
        tempDown = tempDown.parentElement;
        downDistance++;
      }
      return downDistance > 5;
    }

    return false;
  };

  const createPopup = (() => {
    let el = null
    return () => {
      if (el) return el
      el = document.createElement('div')
      Object.assign(el.style, {
        position: 'fixed',
        zIndex: '2147483647',
        pointerEvents: 'none',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'bold 22px system-ui,sans-serif',
        paddingBottom: '2px',
        boxShadow: '0 3px 10px #0004',
        opacity: '0',
        transform: 'scale(0.6)',
        transition: 'all 0.22s ease'
      })
      document.body.appendChild(el)
      return el
    }
  })()

  const updatePopup = forceRed => {
    const p = createPopup()
    p.textContent = count || ''

    const showRed = forceRed || count > MAX_GRABS
    const atMax = count >= MAX_GRABS

    const hue = showRed ? 0 : 90 - (count * 15);
    const bg = `hsl(${Math.max(hue, 0)}, 90%, 50%, 0.9)`;
    const fg = `hsl(${hue}, 100%, ${hue <= 40 ? 100 : 15}%)`;
    const borderColor = (count > 0 && !showRed) ? '#00cc66' : '#c00'

    Object.assign(p.style, {
      left: `${Math.min(mx + 24, innerWidth - 54)}px`,
      top: `${Math.min(my + 24, innerHeight - 54)}px`,
      background: bg,
      color: fg,
      border: `2px solid ${borderColor}`,
      opacity: count > 0 ? '1' : '0',
      transform: count > 0 ? 'scale(1)' : 'scale(0.6)',
    })

    clearTimeout(popupTimer)
    if (count > 0) popupTimer = setTimeout(() => { lastEl = null; count = 0; p.style.opacity = '0' }, 2000)
  }

  const addOverlay = el => {
    if (el._grabOv) return
    const ov = document.createElement('div')
    ov.className = 'grabby-ov'
    document.body.appendChild(ov)
    el._grabOv = ov

    const upd = () => {
      if (!el.isConnected) return ov.remove()
      const r = el.getBoundingClientRect()
      Object.assign(ov.style, {
        top: (r.top - 6) + 'px',
        left: (r.left - 6) + 'px',
        width: (r.width + 12) + 'px',
        height: (r.height + 12) + 'px'
      })
    }
    upd()
    el._grabOvUpd = upd
  }

  const removeOverlay = el => {
    if (el._grabOv) {
      el._grabOv.remove()
      delete el._grabOv
      delete el._grabOvUpd
    }
  }

  const clearAllOverlays = () => activeEls.forEach(removeOverlay)

  const reset = () => {
    activeEls.forEach(el => {
      if (el._grabOrigStyle !== undefined) {
        el.setAttribute('style', el._grabOrigStyle || '')
      } else {
        el.removeAttribute('style')
      }
      if (el._grabBlock) {
        el.removeEventListener('click', el._grabBlock, true)
        delete el._grabBlock
      }
      if (el._grabPasteHandler) {
        el.removeEventListener('paste', el._grabPasteHandler, true)
        delete el._grabPasteHandler
      }
      removeOverlay(el)
    })
    activeEls.clear()

    count = 0
    lastEl = null
    lastLen = -1
    clearAllOverlays()
    updatePopup(false)
    clearTimeout(resetTimer)
  }

  const tryGrabEscalate = () => {
    let target = document.elementFromPoint(mx, my)
    if (!target) return

    while (target && !getVisibleText(target)) {
      target = target.parentElement
    }
    if (!target || target === document.body || target === document.documentElement) return

    if (lastEl && isInNewContext(lastEl, target)) {
      updatePopup(true)
      return
    }

    if (count >= MAX_GRABS) {
      updatePopup(true)
      return
    }

    let cand = target
    while (cand && cand !== document.body) {
      const txt = getVisibleText(cand)
      const len = txt.length

      if (len > lastLen && !activeEls.has(cand)) {
        break
      }
      cand = cand.parentElement
    }

    if (!cand || cand === document.body) {
      updatePopup(true)
      return
    }

    const finalText = getVisibleText(cand)
    if (finalText.length <= lastLen) return

    const origStyle = cand.getAttribute('style') || ''
    cand._grabOrigStyle = origStyle

    cand.setAttribute('style',
      origStyle + ';user-select:text!important;-webkit-user-select:text!important;pointer-events:auto!important;cursor:text!important'
    )

    const block = e => { e.preventDefault(); e.stopImmediatePropagation() }
    cand.addEventListener('click', block, true)
    cand._grabBlock = block

    const forcePlainPaste = e => {
      e.preventDefault()
      const text = (e.clipboardData || window.clipboardData).getData('text/plain')
      document.execCommand('insertText', false, text)
    }
    cand.addEventListener('paste', forcePlainPaste, true)
    cand._grabPasteHandler = forcePlainPaste

    activeEls.add(cand)
    addOverlay(cand)

    GM_setClipboard(finalText)

    lastEl = cand
    lastLen = finalText.length
    count = Math.min(count + 1, MAX_GRABS)

    updatePopup(false)

    clearTimeout(resetTimer)
    resetTimer = setTimeout(reset, 2000)
  }

  addEventListener('mousemove', e => {
    mx = e.clientX
    my = e.clientY
  }, { passive: true })

  addEventListener('scroll', () => {
    activeEls.forEach(el => el._grabOvUpd?.())
  }, { passive: true })

  addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return

    if (e.shiftKey && e.code === 'KeyC') {
      e.preventDefault()
      tryGrabEscalate()
    }

    if (e.shiftKey && e.code === 'KeyX') {
      e.preventDefault()
      fullReset()
    }
  }, true)

  const s = document.createElement('style')
  s.textContent = `
    .grabby-ov {
      position: fixed;
      pointer-events: none;
      border: 2px dashed #ffdd55;
      border-radius: 5px;
      z-index: 2147483646;
      box-sizing: border-box;
      animation: grab-pulse 1.6s infinite alternate;
    }
    @keyframes grab-pulse { to { opacity: 0.35 } }
  `
  document.head.appendChild(s)
})()
