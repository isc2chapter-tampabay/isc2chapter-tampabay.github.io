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
        setFeedback("Please enter your email.", "error");
        return;
      }
      if (!turnstileToken) {
        setFeedback("Please complete the bot check above.", "error");
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
          setFeedback(data.message || "Check your inbox to confirm.", "success");
          form.reset();
          resetTurnstile(form);
        } else {
          setFeedback(data.error || "Something went wrong. Please try again.", "error");
          resetTurnstile(form);
        }
      } catch (err) {
        setFeedback("Network error. Please try again.", "error");
      } finally {
        submit.disabled = false;
      }
    });

    function setFeedback(msg, kind) {
      feedback.textContent = msg;
      feedback.className = "subscribe-feedback" + (kind ? " subscribe-feedback--" + kind : "");
    }
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
