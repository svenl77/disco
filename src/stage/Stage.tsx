import { DiscoBall } from './DiscoBall';
import { Boys } from '../boys/Boys';
import './stage.css';

export function Stage() {
  return (
    <section class="stage" aria-label="Boys Club Disco stage">
      <DiscoBall />
      <div class="dance-floor" />
      <Boys />
    </section>
  );
}
