export default function Error({ error }) {
  return (
    <div>
      <h1>Error</h1>
      <p>{error}</p>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { error } = context.query;
  return {
    props: {
      error: error || null,
    },
  };
}
