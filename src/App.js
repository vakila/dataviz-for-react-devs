import './App.css';
import { BubbleChart } from './BubbleChart';
import { BarChart } from './BarChart';
import { Dropdown } from './Dropdown';
import { analytics } from './data';
import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import * as Plot from "@observablehq/plot";


function ScreenSizeScatterplot({data}) {
  // TODO set a ref on the chart's parent div with useRef
  const chartRef = useRef();

  useEffect(() => {
    const chart = Plot.plot({
      // TODO use a Plot.dot() mark to create a scatterplot of the data
      // with Width on X and Height on Y axis
      // color each dot by the data point's Device type
      // and make its radius and opacity correspond to Sessions
      marks: [
        Plot.dot(data, {
          x: "Width",
          y: "Height",
          fill: "Device",
          fillOpacity: "Sessions",
          r: ({ Sessions }) => Math.log(Sessions),
          title: ({ Resolution, Sessions }) => [Resolution, Sessions].join(": ")
        })
      ],
      opacity: { type: "log" },
      // some default layout tweaks (feel free to change):
      x: { grid: true, domain: [0, 4200] },
      y: { grid: true, domain: [0, 2600] },
      style: {display: "inline"},

      // TODO facet by Device on the X axis, using the same data
      facet: {data: data, x: "Device"}
    })

    // TODO append the chart to the current node of the ref you created
    chartRef.current.append(chart); 

    return () => chart.remove();
  }, [data]);


  return (
    <>
      <h2>Session Screen Sizes</h2>
      <div ref={chartRef} />
    </>
  );
}

function WidthsBarChart({data}) {
  const chartRef = useRef();
  const [selected, setSelected] = useState("mobile");

  useEffect(() => {
    const chart = Plot.plot({
      marks: [
        // TODO use a rectY mark to draw vertical bars
        Plot.rectY(
          data.filter(d => d.Device === selected), // TODO filter the data to only the selected device
          // TODO bin the data on the X axis by the Width value
          // and set the Y value to the sum of all Users in that bin
          Plot.binX(
            { y: "sum", title: "sum" },
            { x: "Width", y: "Users", title: "Users", fill: "Device" }
          )
        )
      ],
      marginLeft: 60,
      style: {display: "inline"}
    });
    chartRef.current.append(chart);
    return () => chart.remove();
  }, [selected, data]);

  return (
    <>
      <h2>Users by Screen Width</h2>
      <Dropdown
        title="Device Type"
        onChange={(event) => setSelected(event.target.value)}
        options={["mobile", "tablet", "desktop"]}
      />
      <div ref={chartRef} />
    </>
  );
}

function DevicesBarChart({data}) {
  const chartRef = useRef();

  useEffect(() => {
    const chart = Plot.plot({
      marks: [
        // TODO use a barY mark to draw vertical bars
        Plot.barY(
          data,
          // TODO group the data on the X axis by Device
          // with total Users per group on the Y axis
          Plot.groupX(
            { y: "sum", title: "sum" },
            { x: "Device", y: "Users", title: "Users", fill: "Device" }
          )
        )
      ],
      marginLeft: 60,
      style: {display: "inline"}
    });
    chartRef.current.append(chart);
    return () => chart.remove();
  }, [data]);


  return (
    <>
      <h2>Total Users by Device Type</h2>
      <div ref={chartRef} />
    </>
  );
}




function DeviceBubbleChart({data}) {
  const chartRef = useRef();

  useEffect(() => {
    const byDevice = d3.rollup(
      // TODO roll up the data into groups by device, and
      // calculate the count (number of observations),
      // total_users, total_sessions, and device of each group
      data,
      (v) => {
        return {
          count: v.length,
          total_users: d3.sum(v, (d) => d.Users),
          total_sessions: d3.sum(v, (d) => d.Sessions),
          device: v[0].Device
        };
      },
      (d) => d.Device
    );

    // TODO create a BubbleChart of the byDevice data
    // each bubble's label and group should correspond to the device type
    // and its value should correspond to the total users for that device
    const chart = BubbleChart(byDevice, {
      label: (d) => d[1].device,  // given d in data, returns text to display on the bubble
      value: (d) => d[1].total_users, // given d in data, returns a quantitative size
      group: (d) => d[1].device, // given d in data, returns a categorical value for color (can be same as label)
      title: (d) => `${d[1].device} ${d[1].total_users} users`, // given d in data, returns text to show on hover
    });
    chartRef.current.append(chart);
    return () => chart.remove();
  }, [data]);

  return (
    <>
      <h2>Total Users by Device Type</h2>
      <div ref={chartRef} />
    </>
  );


}

// Helper function to roll up a dataset by device as before
// Returns an array of the rolled up values
const rollupByDevice = (data) => Array.from(d3.rollup(
  data,
  (v) => {
    return {
      count: v.length,
      total_users: d3.sum(v, (d) => d.Users),
      total_sessions: d3.sum(v, (d) => d.Sessions),
      device: v[0].Device
    };
  },
  (d) => d.Device
).values());



function LayoutsBarChart({data}) {
  const chartRef = useRef();
  const [selected, setSelected] = useState("all");

  // TODO create a chart state with useState()
  const [chart, setChart] = useState(null);
  
  useEffect(() => {
    // TODO use BarChart() andd rollupByDevice() to create
    // a D3 bar chart with the device on the X axis and the
    // total number of users on the Y axis
    const chart = BarChart(rollupByDevice(data), {
      x: (d) => d.device,  // given d in data, returns the (ordinal) x-value
      y: (d) => d.total_users, // given d in data, returns the (quantitative) y-value
      xDomain: ["mobile", "tablet", "desktop"], // an array of (ordinal) x-values
      color: "steelblue", // bar fill color
      marginLeft: 100, // make space for Y axis labels
    });

    setChart(chart); // TODO capture the chart returned by BarChart() as state

    chartRef.current.append(chart);
    return () => chart.remove();
  }, [data]);

  useEffect(() => {
    const aspectFilters = {
      portrait: (d) => d.Width < d.Height,
      landscape: (d) => d.Width > d.Height,
      square: (d) => d.Width && d.Width === d.Height,
      all: (d) => true
    };
    
    // TODO call the chart's update method and
    // pass in the appropriately filtered, rolled up data based on
    // the current selected state, using the filter functions above
    chart?.update(
      rollupByDevice(data.filter(aspectFilters[selected])),
      {
        // TODO set the xDomain to keep the order of the bars constant
        xDomain: ["mobile", "tablet", "desktop"]
      }
    );
  }, [selected, chart, data]);

  return (
    <>
      <h2>Users by Device Type and Layout</h2>
      <Dropdown
        title="Screen Layout"
        onChange={(event) => setSelected(event.target.value)}
        options={["all", "portrait", "landscape", "square"]}
      />
      <div ref={chartRef} />
    </>
  );


}


function App() {
  return (
    <div className="App">
      <h1>User Analytics Data</h1>

      <ScreenSizeScatterplot data={analytics} />

      <WidthsBarChart data={analytics} />

      <DevicesBarChart data={analytics} />

      <DeviceBubbleChart data={analytics} />

      <LayoutsBarChart data={analytics} />
    </div>
  );
}

export default App;
