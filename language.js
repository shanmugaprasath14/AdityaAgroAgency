(function () {
  const translations = window.translations;
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const tamilToEnglish = new Map(
    Object.entries(translations.ta).map(function (entry) {
      return [entry[1], entry[0]];
    })
  );
  const originalTitle = document.title;
  let language = localStorage.getItem('site-language') === 'ta' ? 'ta' : 'en';

  function getSourceText(text) {
    const trimmed = text.trim();
    return tamilToEnglish.get(trimmed) || trimmed;
  }

  function translateText(text) {
    return translations[language][getSourceText(text)] || text;
  }

  function translateDocument() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      if (!originalText.has(node)) {
        const value = node.nodeValue;
        const leading = value.match(/^\s*/)[0];
        const trailing = value.match(/\s*$/)[0];
        const source = getSourceText(value);
        originalText.set(node, leading + source + trailing);
      }

      const source = originalText.get(node);
      const leading = source.match(/^\s*/)[0];
      const trailing = source.match(/\s*$/)[0];
      const text = source.trim();
      const translated = translations[language][text];
      if (translated) node.nodeValue = leading + translated + trailing;
    }

    document.querySelectorAll('[placeholder], [aria-label], [alt], [title]').forEach(function (element) {
      ['placeholder', 'aria-label', 'alt', 'title'].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        let originals = originalAttributes.get(element);
        if (!originals) {
          originals = new Map();
          originalAttributes.set(element, originals);
        }
        if (!originals.has(attribute)) {
          originals.set(attribute, getSourceText(element.getAttribute(attribute)));
        }
        const source = originals.get(attribute);
        const translated = translations[language][source];
        if (translated) element.setAttribute(attribute, translated);
      });
    });

    document.title = translations[language][getSourceText(originalTitle)] || originalTitle;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-language]').forEach(function (button) {
      const selected = button.dataset.language === language;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  window.translateText = translateText;
  document.querySelectorAll('[data-language]').forEach(function (button) {
    button.addEventListener('click', function () {
      language = button.dataset.language;
      localStorage.setItem('site-language', language);
      translateDocument();
    });
  });

  translateDocument();
})();
