// Email announcements signup — posts to /api/subscribe (Cloudflare Pages Function),
// which validates Turnstile and pushes the subscriber to Mailchimp with pending status.

(function () {
  const form = document.getElementById("subscribeForm");
  if (!form) return;

  const feedback = form.querySelector(".subscribe-feedback");
  const submit = form.querySelector(".subscribe-submit");
  const emailInput = form.querySelector('input[name="email"]');

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
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setFeedback(data.message || "Check your inbox to confirm.", "success");
        form.reset();
        if (window.turnstile) window.turnstile.reset();
      } else {
        setFeedback(data.error || "Something went wrong. Please try again.", "error");
        if (window.turnstile) window.turnstile.reset();
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
})();
