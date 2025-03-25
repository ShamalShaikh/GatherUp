import React, { useState } from "react";
import "./SearchPage.css";

//The propertoes of what searchPage should have for things to dilter through
interface Props {
  items: string[];
  heading: string;
  onSelectItem: (item: string) => void;
}

function SearchPage() {
  // For now, a based example where certain events, times, cities, and websites hit certain cases
  //[eventName, city, BeginningTime, endingTime, websiteLink]
  let locationEvents = [
    ["Aight event", "Boulder", "7:45PM", "8:45PM", "website1"],
    [
      "Highly anticipated event",
      "Brooksfield",
      "9:00AM",
      "11:15AM",
      "website2",
    ],
    ["Aight event", "Denver", "12:30PM", "12:55PM", "website1"],
    ["Too much traffic event", "Denver", "7:45PM", "8:25PM", "website3"],
    [
      "Fifth test event(not creative enough)",
      "Boulder",
      "9:00PM",
      "9:15PM",
      "",
    ],
  ];

  //The hook to grab the index from the list
  const [selectedIndex, setSelectedIndex] = useState(-1);
  //The string to filter the names
  const [filter, setFilter] = useState("");

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-black">
        <h1 className="title">Welcome some user(We'll figure this shit out)</h1>
      </nav>
      <div className="btn-group">
        <button
          className="btn btn-secondary btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          Cities
        </button>
        <ul className="dropdown-menu">...</ul>
      </div>
      <div className="btn-group">
        <button
          className="btn btn-secondary btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          beginningTimes
        </button>
        <ul className="dropdown-menu">...</ul>
      </div>
      <div className="btn-group">
        <button
          className="btn btn-secondary btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          endingTimes
        </button>
        <ul className="dropdown-menu">...</ul>
      </div>
      <input
        type="text"
        className="search-input"
        placeholder="I don't work yet, go away"
        value={filter}
      ></input>
      <button type="button" className="btn btn-secondary btn-sm">
        Eventually search hopefully
      </button>
      <ul className="list-group">
        {locationEvents.map((item, index) => (
          <li
            className={
              selectedIndex == index
                ? "list-group-item active"
                : "list-group-item"
            }
            onClick={() => {
              setSelectedIndex(index);
              onSelectItem(
                item
              ); /*This has errors for now, but should still work. It's mainly to prepare what I want the button to do*/
            }}
          >
            <span className="event-name">{item[0]}</span>
            <span className="event-location">{item[1]}</span>
            <span className="event-timeStart">{item[2]}</span>
            <span className="event-timeEnd">{item[3]}</span>
            <span className="event-website">
              {item[4] ? (
                <a
                  href={`https://${item[4]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item[4]}
                </a>
              ) : (
                <span className="no-link">
                  website unavailable or not found
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default SearchPage;
