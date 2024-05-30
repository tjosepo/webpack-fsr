export function loader() {
  console.log("loader");
  return null;
}

export default function Component(options) {
  return (
    <div>
      <h1>Foo</h1>
    </div>
  );
}
