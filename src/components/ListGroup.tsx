// import { Fragment } from "react";
//rafce is a shortcut
import { useState } from "react";

// import { MouseEvent } from "react";

interface Props {
  items: string[];
  heading: string;
  //(item: string) => void
  onSelectItem: (item: string) => void; //Onclick similar
}

function ListGroup({ items, heading, onSelectItem }: Props) {
  //A state hook telling it that it can have data that can change
  const [selectedIndex, setSelectedIndex] = useState(-1);
  //   arr[0]; // variable (selectedIndex)
  //   arr[1]; // updater function

  //Event handler
  //   const handleCLick = (event: MouseEvent) => console.log(event);

  //This is normally for one result
  //   const message = items.length == 0 ? <p> No items found</p> : null;

  //This is more for dynamic and parameter needed results
  const getMessage = () => {
    return items.length == 0 ? <p> No items found</p> : null;
    //This is the same as:
    //return items.length == 0 && <p> No items found</p>;
    //Meaning if the first condition is true, the result would always be true and then run, but if false, the the second condition would not run
  };

  return (
    <>
      <h1>{heading}</h1>
      {getMessage()}
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            className={
              selectedIndex == index
                ? "list-group-item active"
                : "list-group-item"
            }
            key={item}
            onClick={() => {
              setSelectedIndex(index);
              onSelectItem(item);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </>
    //One way to bypass reacts' condition for one javascript code, works as if using Fragment
    // <>
    //   <h1>List Name</h1>
    //   <ul className="list-group">
    //     <li className="list-group-item">An item</li>
    //     <li className="list-group-item">A second item</li>
    //     <li className="list-group-item">A third item</li>
    //     <li className="list-group-item">A fourth item</li>
    //     <li className="list-group-item">And a fifth one</li>
    //   </ul>
    // </>
    //Another unecessary way to bypass reacts' condition for one javascript code
    // <div>
    //     <h1>List Name</h1>
    //     <ul className="list-group">
    //       <li className="list-group-item">An item</li>
    //       <li className="list-group-item">A second item</li>
    //       <li className="list-group-item">A third item</li>
    //       <li className="list-group-item">A fourth item</li>
    //       <li className="list-group-item">And a fifth one</li>
    //     </ul>
    // </div>
  );
}

export default ListGroup;
