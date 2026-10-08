import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Card from "../components/ui/Card";
export default function NotFound() {
  return (
    <Card>
      <EmptyState
        title="This page isn’t on the map."
        description="The link may have changed. Head back to your intelligence workspace."
        action={
          <Link to="/" className="btn-primary">
            Back to overview
          </Link>
        }
      />
    </Card>
  );
}
