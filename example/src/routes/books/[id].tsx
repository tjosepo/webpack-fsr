import { useParams } from "react-router-dom";

export default function () {
  const { id } = useParams();

  return <div>Books: {id}</div>;
}
