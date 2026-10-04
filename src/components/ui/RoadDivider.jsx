import './RoadDivider.css';

const RoadDivider = ({ doubleYellow = false }) => (
  <div className="road-divider" aria-hidden="true">
    <span className={`road-divider__line${doubleYellow ? ' road-divider__line--double-yellow' : ''}`} />
  </div>
);

export default RoadDivider;