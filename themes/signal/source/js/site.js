(function () {
  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-toggle');
  var navButton = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  var progress = document.querySelector('.reading-progress');

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('color-scheme', next);
    });
  }

  if (navButton && nav) {
    navButton.addEventListener('click', function () {
      var open = navButton.getAttribute('aria-expanded') === 'true';
      navButton.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
  }

  var article = document.querySelector('.article-body');
  var toc = document.querySelector('.toc');
  if (article && toc) {
    var headings = Array.prototype.slice.call(article.querySelectorAll('h1, h2, h3'));
    var firstLevel = headings.reduce(function (lowest, heading) {
      return Math.min(lowest, Number(heading.tagName.slice(1)));
    }, 4);
    var section = 0;
    var subsection = 0;
    headings.forEach(function (heading, index) {
      var firstTextNode = Array.prototype.find.call(heading.childNodes, function (node) {
        return node.nodeType === 3 && node.nodeValue.trim();
      });
      if (firstTextNode) {
        firstTextNode.nodeValue = firstTextNode.nodeValue.replace(/^\s*\d+(?:\.\d+)*\.?\s+/, '');
      }
      var level = Number(heading.tagName.slice(1));
      var number;
      if (level === firstLevel) {
        section += 1;
        subsection = 0;
        number = String(section);
        heading.classList.add('section-heading-primary');
        heading.dataset.section = number;
      } else {
        subsection += 1;
        number = section + '.' + subsection;
      }
      if (!heading.id) heading.id = 'section-' + (index + 1);
      var link = document.createElement('a');
      link.href = '#' + heading.id;
      var numeral = document.createElement('span');
      numeral.className = 'toc-number';
      numeral.textContent = number;
      var label = document.createElement('span');
      label.textContent = heading.textContent;
      link.appendChild(numeral);
      link.appendChild(label);
      if (level > firstLevel) link.className = 'toc-sub';
      toc.appendChild(link);
    });
    if (!headings.length) {
      var empty = document.createElement('span');
      empty.textContent = 'A short note';
      toc.appendChild(empty);
    }
  }

  document.querySelectorAll('figure.highlight').forEach(function (block) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy';
    button.addEventListener('click', function () {
      var code = block.querySelector('.code');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(function () {
        button.textContent = 'Copied';
        window.setTimeout(function () { button.textContent = 'Copy'; }, 1400);
      });
    });
    block.appendChild(button);
  });

  function updateProgress() {
    if (!progress || !article) return;
    var rect = article.getBoundingClientRect();
    var total = article.offsetHeight - window.innerHeight;
    var consumed = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
    progress.style.transform = 'scaleX(' + (total > 0 ? consumed / total : 0) + ')';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}());
