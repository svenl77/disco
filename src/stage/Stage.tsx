import { DiscoBall } from './DiscoBall';
import { Boys } from '../boys/Boys';
import { BubbleLayer } from '../bubbles/BubbleLayer';
import { mood } from '../state';
import './stage.css';

export function Stage() {
  return (
    <section class="stage" aria-label="Boys Club Disco stage" data-mood={mood()}>
      <DiscoBall />
      <div class="dance-floor" />
      <Boys />
      <BubbleLayer />
    </section>
  );
}
