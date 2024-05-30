export function loader() {
  console.log("loader");
  return null;
}

export function asyncLoader() {
  console.log("asyncLoader");
  return null;
}

export default function Component(options) {
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
