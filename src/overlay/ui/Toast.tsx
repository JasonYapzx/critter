import { IconCheck } from "./icons";

export function Toast({ message }: { message: string }) {
  return (
    <div className="crit-toast" data-crit-chrome="" role="status">
      <span className="crit-toast-check" aria-hidden="true">
        <IconCheck />
      </span>
      {message}
    </div>
  );
}
