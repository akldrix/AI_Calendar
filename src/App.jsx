import React from "react";
import Text from "./components/text";
function App() {
  const styles = {
    color: 'lightgreen',
    padding: '100px 700px',
    display: 'flex',
    alignItems: 'center' ,
    justifyContent: 'space-between',
  };
  return (
    <div className="txt" style={styles}>
      <h1>BIG</h1>
      <h3 >text</h3>
    </div>
  );
}

export default App;
