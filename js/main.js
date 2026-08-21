// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  const burger = document.getElementById("nav-burger");
  const mobileNav = document.getElementById("nav-mobile");

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      const isOpen = mobileNav.classList.toggle("open");
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
      if (!burger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Copy to Clipboard for Code Blocks
  const codeBlocks = document.querySelectorAll("pre.code");
  codeBlocks.forEach(function (block) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy-btn mono";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");

    btn.addEventListener("click", function () {
      const codeText = block.querySelector("code") ? block.querySelector("code").innerText : block.innerText;
      navigator.clipboard.writeText(codeText.trim()).then(function () {
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = "Copy";
        }, 2000);
      }).catch(function (err) {
        console.error("Failed to copy code: ", err);
      });
    });

    block.appendChild(btn);
  });

  // Table of Contents Active Link Highlight on Scroll
  const tocLinks = document.querySelectorAll(".toc-link");
  const headings = Array.from(document.querySelectorAll(".article-content h2, .article-content h3[id]"));

  if (tocLinks.length > 0 && headings.length > 0) {
    function onScroll() {
      const scrollPos = window.scrollY + 120;
      let currentId = "";

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        if (heading.offsetTop <= scrollPos) {
          currentId = heading.getAttribute("id");
        } else {
          break;
        }
      }

      tocLinks.forEach(function (link) {
        if (link.getAttribute("href") === "#" + currentId) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
});
