import './Spinner.css';

const Spinner = ({ size = 'md' }) => {
  return (
    <div className={`spinner spinner--${size}`}>
      <div className="spinner__circle"></div>
    </div>
  );
};

export default Spinner;
