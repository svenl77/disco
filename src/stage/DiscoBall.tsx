/**
 * The mirror ball — pure CSS, layered radial gradients + animated meridians.
 * Clicking the ball triggers a fireworks burst behind the boys.
 */
import { triggerDiscoBall } from '../state';

export function DiscoBall() {
  function onClick(e: MouseEvent) {
    e.preventDefault();
    void triggerDiscoBall();
    // Brief pop animation on the ball
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('ball-popped');
    void el.offsetWidth;
    el.classList.add('ball-popped');
    setTimeout(() => el.classList.remove('ball-popped'), 600);
  }

  return (
    <div class="ball-wrap">
      <div class="ball-beams" />
      <div class="ball-string" />
      <div
        class="discoball"
        onClick={onClick}
        role="button"
        aria-label="Disco ball — click for fireworks"
        tabIndex={0}
      >
        <div class="discoball-lat" />
        <div class="discoball-mer" />
        <div class="discoball-sweep" />
        <div class="discoball-glints" />
        <div class="discoball-shine" />
      </div>
    </div>
  );
}
