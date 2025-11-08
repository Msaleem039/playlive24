import { SpinnerCircular } from 'spinners-react';

export default function Spinner() {
  return (
    <div className="flex justify-center items-center h-screen">
    <SpinnerCircular
      size={60}
      color="#1E88E5"          // cricket-team blue
      secondaryColor="#FFC107" // trophy gold
    />
    </div>
  );
}
