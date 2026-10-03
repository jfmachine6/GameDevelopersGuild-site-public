const titleVideo = document.querySelector(".hero__title-fire");
const titleGraphic = document.querySelector(".hero__title-video");
const title = document.querySelector(".hero__title");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (
  titleVideo instanceof HTMLVideoElement &&
  titleGraphic instanceof SVGSVGElement &&
  title instanceof HTMLHeadingElement &&
  CSS.supports("mask", "url(#flame-title-mask)")
) {
  const updateTitleVideo = async () => {
    if (reducedMotion.matches) {
      titleVideo.pause();
      titleGraphic.classList.remove("is-playing");
      title.classList.remove("has-fire-video");
      return;
    }

    try {
      await titleVideo.play();
      if (reducedMotion.matches) {
        titleVideo.pause();
        return;
      }
      titleGraphic.classList.add("is-playing");
      title.classList.add("has-fire-video");
    } catch (error) {
      console.warn("The animated title is unavailable; showing the color fallback.", error);
    }
  };

  reducedMotion.addEventListener("change", updateTitleVideo);
  updateTitleVideo();
}
