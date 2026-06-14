const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuButton = document.querySelector("[data-menu-button]");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
};

const closeNav = () => {
  if (!nav?.classList.contains("is-open")) return;
  nav.classList.remove("is-open");
  menuButton?.setAttribute("aria-label", "Open menu");
};

const scrollToHashTarget = () => {
  const hash = window.location.hash;
  if (!hash || hash === "#top") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }

  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  target.scrollIntoView({ block: "start" });
};

if (!window.location.hash || window.location.hash === "#top") {
  window.scrollTo(0, 0);
}

setHeaderState();
window.addEventListener(
  "scroll",
  () => {
    setHeaderState();
    closeNav();
  },
  { passive: true }
);

window.addEventListener("hashchange", () => {
  closeNav();
  window.setTimeout(scrollToHashTarget, 40);
});

window.addEventListener("load", () => {
  window.setTimeout(scrollToHashTarget, 120);
});

document.fonts?.ready.then(() => {
  window.setTimeout(scrollToHashTarget, 120);
});

menuButton?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

document.querySelector(".session-ribbon")?.addEventListener("click", (event) => {
  const joinSection = document.getElementById("join");
  if (!joinSection) return;

  event.preventDefault();
  closeNav();
  joinSection.scrollIntoView({ block: "start" });
  window.history.pushState(null, "", "#join");
});

document.addEventListener("click", (event) => {
  if (!nav?.classList.contains("is-open")) return;
  if (nav.contains(event.target) || menuButton?.contains(event.target)) return;
  closeNav();
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.setProperty("--reveal-delay", `${Math.min(index * 22, 140)}ms`);
  revealObserver.observe(element);
});

const stats = document.querySelector("[data-stats]");
let statsAnimated = false;

const animateCounter = (element) => {
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target)) return;

  const duration = 850;
  const start = performance.now();
  let lastValue = -1;

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    if (value !== lastValue) {
      element.textContent = value.toString();
      lastValue = value;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = target.toString();
    }
  };

  requestAnimationFrame(tick);
};

if (stats) {
  const statsObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        stats.querySelectorAll("[data-count]").forEach(animateCounter);
        statsObserver.disconnect();
      }
    },
    { threshold: 0.35 }
  );

  statsObserver.observe(stats);
}

const stepDetails = [
  "Show up to our counselling session on Saturday, 7 June in your society. Meet the coaches, see a demo, ask everything.",
  "Sessions are graded. Everyone works at their own level. No one waits, no one gets left behind. You just move.",
  "We track your progress and adjust every month. Your neighbours become your accountability, and your community."
];

const stepEmojis = ["✅", "🧘", "💪"];

const stepTrack = document.querySelector("[data-step-track]");
const stepDetail = document.querySelector("[data-step-detail]");
let highestCompletedStep = -1;
let activeStep = null;
let stepsAnimationStarted = false;
let autoLineRunning = false;
const stepButtons = document.querySelectorAll("[data-step]");

const renderSteps = () => {
  stepButtons.forEach((step) => {
    const stepIndex = Number(step.dataset.step);
    const isCompleted = stepIndex <= highestCompletedStep;
    const isActive = stepIndex === activeStep;
    step.classList.toggle("active", isActive);
    step.classList.toggle("completed", isCompleted);

    const emoji = step.querySelector(".step-emoji");
    if (!emoji) return;
    emoji.textContent = isCompleted || isActive ? stepEmojis[stepIndex] : "";
    emoji.classList.toggle("is-showing", isCompleted || isActive);
  });

  if (stepTrack && !autoLineRunning) {
    const maxStep = Math.max(stepButtons.length - 1, 1);
    const progress = highestCompletedStep < 0 ? 0 : (highestCompletedStep / maxStep) * 80;
    stepTrack.style.setProperty("--step-progress", `${progress}%`);
  }
};

const setStep = (index, source = "auto") => {
  if (source === "auto") {
    activeStep = index;
    highestCompletedStep = Math.max(highestCompletedStep, index);
  } else {
    activeStep = index;
  }

  renderSteps();

  if (source === "manual" && stepDetail) {
    stepDetail.textContent = stepDetails[index];
  }
};

const resetAutoActiveStep = () => {
  activeStep = null;
  renderSteps();
  if (stepDetail) {
    stepDetail.textContent = stepDetails[0];
  }
};

stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setStep(Number(button.dataset.step), "manual");
  });
});

renderSteps();

if (stepTrack) {
  const stepsObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || stepsAnimationStarted) return;
      stepsAnimationStarted = true;
      autoLineRunning = true;
      stepTrack.style.setProperty("--step-progress", "0%");

      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          stepTrack.style.setProperty("--step-progress", "80%");
        }, 80);
      });

      [0, 1, 2].forEach((stepIndex, sequenceIndex) => {
        window.setTimeout(() => {
          setStep(stepIndex, "auto");
          if (stepIndex === 2) {
            window.setTimeout(() => {
              autoLineRunning = false;
              resetAutoActiveStep();
            }, 900);
          }
        }, sequenceIndex * 850);
      });

      stepsObserver.disconnect();
    },
    { threshold: 0.36 }
  );

  stepsObserver.observe(stepTrack);
}

const availabilityOpen = document.querySelector("[data-availability-open]");
const availabilityModal = document.querySelector("[data-availability-modal]");
const availabilityClose = document.querySelector("[data-availability-close]");
const addressInput = document.querySelector("[data-address-input]");
const availabilityNote = document.querySelector("[data-availability-note]");
const heroNote = document.querySelector("[data-hero-note]");
const heroNoteMinimize = document.querySelector("[data-hero-note-minimize]");
const heroNoteRestore = document.querySelector("[data-hero-note-restore]");
let availabilityTimer;

const setAvailabilityNote = (message) => {
  if (availabilityNote) {
    availabilityNote.textContent = message;
  }
};

const runAvailabilityCheck = (source = "your society") => {
  window.clearTimeout(availabilityTimer);
  setAvailabilityNote(`Checking availability near ${source}...`);
  availabilityTimer = window.setTimeout(() => {
    setAvailabilityNote("Free session availability can be confirmed here. Enter your society name or use detect location.");
  }, 900);
};

const openAvailability = () => {
  if (!availabilityModal) return;
  availabilityModal.hidden = false;
  document.body.classList.add("modal-open");
  runAvailabilityCheck("your society");
  window.setTimeout(() => addressInput?.focus(), 40);
};

const closeAvailability = () => {
  if (!availabilityModal) return;
  availabilityModal.hidden = true;
  document.body.classList.remove("modal-open");
  availabilityOpen?.focus();
};

availabilityOpen?.addEventListener("click", openAvailability);
availabilityClose?.addEventListener("click", closeAvailability);

heroNoteMinimize?.addEventListener("click", (event) => {
  event.stopPropagation();
  heroNote?.classList.add("is-minimized");
  if (heroNoteRestore) {
    heroNoteRestore.hidden = false;
  }
});

heroNoteRestore?.addEventListener("click", () => {
  heroNote?.classList.remove("is-minimized");
  heroNoteRestore.hidden = true;
});

availabilityModal?.addEventListener("click", (event) => {
  if (event.target === availabilityModal) {
    closeAvailability();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && availabilityModal && !availabilityModal.hidden) {
    closeAvailability();
  }
});

document.querySelector("[data-detect-location]")?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setAvailabilityNote("Location detection is not available in this browser. Enter your society name instead.");
    return;
  }

  setAvailabilityNote("Detecting your location...");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      addressInput.value = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      runAvailabilityCheck("your detected location");
    },
    () => {
      setAvailabilityNote("We could not detect your location. Enter your society or area manually.");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

document.querySelector("[data-check-address]")?.addEventListener("click", () => {
  const value = addressInput?.value.trim();
  if (value) {
    runAvailabilityCheck(value);
  } else {
    setAvailabilityNote("Enter a society name or use detect location first.");
  }
});

document.querySelectorAll(".slot").forEach((slot) => {
  slot.addEventListener("click", () => {
    document.querySelectorAll(".slot").forEach((item) => item.classList.remove("active"));
    slot.classList.add("active");
  });
});

const bookingForm = document.querySelector("[data-form]");
const formSteps = bookingForm?.querySelectorAll("[data-form-step]");
const formProgress = bookingForm?.querySelectorAll("[data-form-progress]");
const defaultSubmitText = "SUBMIT REGISTRATION";
const defaultFormNote = "We will reach out on WhatsApp to confirm your slot.";
let currentFormStep = 0;

const formStepFields = [
  ["name", "phone", "email", "age", "gender", "society", "flat", "address"],
  ["emergency-name", "relationship", "emergency-phone", "experience", "slot-first", "slot-second"],
  ["conditions", "medication"]
];

const isFormFieldFilled = (fieldName) => {
  if (!bookingForm) return false;
  const fields = Array.from(bookingForm.elements).filter((field) => field.name === fieldName);
  if (!fields.length) return false;

  const firstField = fields[0];
  if (firstField.type === "radio" || firstField.type === "checkbox") {
    return fields.some((field) => field.checked);
  }

  return String(firstField.value || "").trim().length > 0;
};

const isFormStepComplete = (index) => {
  const fields = formStepFields[index] || [];
  return fields.length > 0 && fields.every(isFormFieldFilled);
};

const updateFormProgress = () => {
  formProgress?.forEach((step, stepIndex) => {
    step.classList.toggle("active", stepIndex === currentFormStep);
    step.classList.toggle("completed", isFormStepComplete(stepIndex));
  });
};

const showFormStep = (index) => {
  if (!formSteps?.length) return;
  currentFormStep = Math.max(0, Math.min(index, formSteps.length - 1));

  formSteps.forEach((step, stepIndex) => {
    step.classList.toggle("active", stepIndex === currentFormStep);
  });

  updateFormProgress();
};

const resetBookingForm = () => {
  if (!bookingForm) return;
  const submit = bookingForm.querySelector(".form-submit");
  const note = bookingForm.querySelector("[data-form-note]");

  bookingForm.reset();
  bookingForm.classList.remove("is-submitted");
  if (submit) {
    submit.textContent = defaultSubmitText;
    submit.disabled = false;
  }
  if (note) {
    note.textContent = defaultFormNote;
  }
  showFormStep(0);
};

bookingForm?.querySelectorAll("[data-form-next]").forEach((button) => {
  button.addEventListener("click", () => showFormStep(currentFormStep + 1));
});

bookingForm?.querySelectorAll("[data-form-prev]").forEach((button) => {
  button.addEventListener("click", () => showFormStep(currentFormStep - 1));
});

formProgress?.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.formProgress);
    if (index === 0 && bookingForm?.classList.contains("is-submitted")) {
      resetBookingForm();
      return;
    }
    showFormStep(index);
  });
});

showFormStep(0);

bookingForm?.addEventListener("input", updateFormProgress);
bookingForm?.addEventListener("change", updateFormProgress);

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector(".form-submit");
  const note = form.querySelector("[data-form-note]");
  const firstIncompleteStep = Array.from(formSteps || []).findIndex((_, index) => !isFormStepComplete(index));

  if (firstIncompleteStep >= 0) {
    note.textContent = "Please complete the required details before submitting.";
    showFormStep(firstIncompleteStep);
    return;
  }

  submit.textContent = "✓ Registered";
  submit.disabled = true;
  note.textContent = "Thank you. We will message you shortly with session details.";
  formProgress?.forEach((step) => step.classList.add("completed"));
  form.classList.add("is-submitted");
});

const scrollParallaxItems = document.querySelectorAll("[data-scroll-parallax]");
let parallaxFrame;

const updateScrollParallax = () => {
  parallaxFrame = undefined;
  scrollParallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const strength = Number(item.dataset.scrollParallax || 0.1);
    const viewportCenter = window.innerHeight / 2;
    const itemCenter = rect.top + rect.height / 2;
    const offset = (viewportCenter - itemCenter) * strength;
    item.style.setProperty("--scroll-parallax", `${Math.max(-54, Math.min(54, offset))}px`);
  });
};

const requestScrollParallax = () => {
  if (parallaxFrame) return;
  parallaxFrame = window.requestAnimationFrame(updateScrollParallax);
};

window.addEventListener("scroll", requestScrollParallax, { passive: true });
window.addEventListener("resize", requestScrollParallax);
requestScrollParallax();
