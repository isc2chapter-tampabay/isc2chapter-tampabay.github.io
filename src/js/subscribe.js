// Generic handler for email-signup forms on the site.
// Each form carries a data-source attribute ("website", "study-groups", etc.)
// that the /subscribe function uses to decide which Mailchimp tags to apply.

(function () {
  document.querySelectorAll(".subscribe-form").forEach(initForm);

  function initForm(form) {
    const feedback = form.querySelector(".subscribe-feedback");
    const submit = form.querySelector(".subscribe-submit");
    const emailInput = form.querySelector('input[name="email"]');
    const source = form.dataset.source || "website";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const turnstileField = form.querySelector('[name="cf-turnstile-response"]');
      const turnstileToken = turnstileField ? turnstileField.value : "";

      if (!email) {
        showError("Please enter your email.");
        return;
      }
      if (!turnstileToken) {
        showError("Please complete the bot check above.");
        return;
      }

      submit.disabled = true;
      setFeedback("Submitting…", "");

      try {
        const res = await fetch("/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, turnstileToken, source }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          showSuccess(data.message || "Check your inbox to confirm.");
        } else {
          showError(data.error || "Something went wrong. Please try again.");
          resetTurnstile(form);
        }
      } catch (err) {
        showError("Network error. Please try again.");
      } finally {
        submit.disabled = false;
      }
    });

    function setFeedback(msg, kind) {
      feedback.textContent = msg;
      feedback.className = "subscribe-feedback" + (kind ? " subscribe-feedback--" + kind : "");
    }

    function showError(msg) {
      setFeedback(msg, "error");
      scrollIntoView(feedback);
    }

    // On success, replace the form's inputs with a prominent confirmation
    // panel so the user sees their submission went through, even if they're
    // not looking at the feedback area. Also scrolls into view.
    function showSuccess(message) {
      const panel = document.createElement("div");
      panel.className = "subscribe-success";
      panel.setAttribute("role", "status");
      panel.innerHTML =
        '<svg class="subscribe-success-icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>' +
        "</svg>";
      const p = document.createElement("p");
      p.className = "subscribe-success-message";
      p.textContent = message;
      panel.appendChild(p);

      form.replaceChildren(panel);
      scrollIntoView(panel);
    }
  }

  function scrollIntoView(el) {
    if (!el || typeof el.scrollIntoView !== "function") return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Turnstile renders a widget per `.cf-turnstile` element on the page. Resetting
  // by element (rather than the global window.turnstile.reset()) avoids clearing
  // sibling forms' tokens if multiple signup forms end up on the same page.
  function resetTurnstile(form) {
    const widget = form.querySelector(".cf-turnstile");
    if (widget && window.turnstile) {
      try { window.turnstile.reset(widget); } catch (_) { /* noop */ }
    }
  }
})();
