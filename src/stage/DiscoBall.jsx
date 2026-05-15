/**
 * The mirror ball — pure CSS, layered radial gradients + animated meridians.
 * Looks spherical from any angle. Sweeps a bright band across to fake rotation.
 */
export function DiscoBall() {
    return (<div class="ball-wrap" aria-hidden="true">
      <div class="ball-beams"/>
      <div class="ball-string"/>
      <div class="discoball">
        <div class="discoball-lat"/>
        <div class="discoball-mer"/>
        <div class="discoball-sweep"/>
        <div class="discoball-glints"/>
        <div class="discoball-shine"/>
      </div>
    </div>);
}
