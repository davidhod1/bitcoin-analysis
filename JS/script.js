
d3.json("https://min-api.cryptocompare.com/data/histoday?fsym=BTC&tsym=USD&limit=200&aggregate=3&e=CCCAGG",function(input) {

const data = input.Data;

data.forEach(function(d){ d.time = new Date(d.time * 1000) });
      
const ySelector = (d) => d.close;

const dataMax = d3.max(data, ySelector);

const maxGraphValue = 80000 - dataMax;

let marginMain = {top:40, right: 20, bottom: 110, left: 50},
    marginSecondary = {top: 580, right: 20, bottom: 10, left: 50};

let widthMain = 1200 - marginMain.left - marginMain.right,
    heightMain = 600 - marginMain.top - marginMain.left,
    heightSecondary = 650 - marginSecondary.top - marginSecondary.bottom;

let svg = d3.select("#graph")
      .append("svg")
      .attr("width", widthMain + marginMain.left + marginMain.right)
      .attr("height", heightMain + marginMain.top + marginMain.bottom)

let x = d3.scaleTime().range([0, widthMain]),
    x2 = d3.scaleTime().range([0, widthMain]),
    y2 = d3.scaleLinear().range([heightSecondary, 0]),
    y = d3.scaleLinear().range([heightMain, 0]);

    x.domain(d3.extent(data, function(d) { return d.time; }));
    y.domain([0, dataMax + maxGraphValue]);
    x2.domain(x.domain());
    y2.domain(y.domain());
    
let ordinateMain = d3.axisBottom(x),
    ordinateSecondary = d3.axisBottom(x2),
    abscissaMain = d3.axisLeft(y).tickFormat(function(d) { return "$" + d });

const bisect = d3.bisector(function(d) { return d.time; }).left;


let brush = d3.brushX()
    .extent([[0, 0], [widthMain, heightSecondary]])
    .on("brush end", brushed);

let zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [widthMain, heightMain]])
    .extent([[0, 0], [widthMain, heightMain]])
    .on("zoom", zoomed);

let lineMain = d3.line()
    .x(function(d) { return x(d.time); })
    .y(function(d) { return y(d.close); });

let lineSecondary = d3.line()
    .x(function(d) { return x2(d.time); })
    .y(function(d) { return y2(d.close); });
    

svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", widthMain)
      .attr("height", heightMain);

let focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + marginMain.left + "," + marginMain.top + ")");

let context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + marginSecondary.left + "," + marginSecondary.top + ")");

let circle = focus.append('g')
      .append('circle')
      .style("fill", "none")
      .attr("stroke", "white")
      .attr('r', 5)
      .style("opacity", 0)
      .attr("position", "absolute");


let dashedline = focus.append("line")
      .attr("class", "mouse-line")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .style("opacity", 0)
      .style("stroke-dasharray","5,5");


let tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("width", 200);
       
focus.append("path")
      .datum(data)
      .attr("class", "lineMain")
      .attr("d", lineMain);
      
focus.append("g")
      .attr("class", "axis axis--x axisMain")
      .attr("transform", "translate(0," + heightMain + ")")
      .call(ordinateMain);

focus.append("g")
      .attr("class", "axis axis--y axisMain")
      .call(abscissaMain);

context.append("path")
      .datum(data)
      .attr("class", "lineSecondary")
      .attr("d", lineSecondary);

context.append("g")
      .attr("class", "axis axis--x axisSecondary")
      .attr("transform", "translate(0," + heightSecondary + ")")
      .call(ordinateSecondary)


context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

   
      
svg.append("rect")
      .attr("class", "zoom")
      .attr("width", widthMain)
      .attr("height", heightMain)
      .attr("transform", "translate(" + marginMain.left + "," + marginMain.top + ")")
      .attr('pointer-events', 'all')
      .call(zoom);

svg.select(".zoom")
      .on('mouseenter', showAttributes)
      .on('mouseleave', hideAttributes)
      .on('mousemove', movingAttributes);



function brushed() 
{
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      let s = d3.event.selection || x2.range();
      x.domain(s.map(x2.invert, x2));
      focus.select(".lineMain").attr("d", lineMain);
      focus.select(".axis--x").call(ordinateMain);
      svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(widthMain / (s[1] - s[0]))
            .translate(-s[0], 0));
}

function zoomed() 
{
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  let t = d3.event.transform;

  x.domain(t.rescaleX(x2).domain());
  
  focus.select(".lineMain").attr("d", lineMain);
  focus.select(".axis--x").call(ordinateMain);
  
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));

  movingAttributes();
  
  
}

function showAttributes()
 {
      circle.style("opacity", 1)
      tooltip.style("opacity", 1);
      dashedline.style("opacity", 1);
 }


 function hideAttributes()
 {
      circle.style("opacity", 0)
      dashedline.style("opacity", 0);
      tooltip.style("opacity", 0);
 }

 function movingAttributes()
 {
      let rect = document.getElementsByClassName('zoom');
      
      let x0 = x.invert(d3.mouse(rect[0])[0]);

     
 
      let i = bisect(data, x0, 1);
      
      
      let d0 = data[i-1];
      let d1 = data[i];
      
      let d = d0;
      
      
      
      if(d1 && d1.time)
      {
        d = x0 - d0.time > d1.time - x0 ? d1.time : d0.time;
      }
      
      
      let index = data.map(function(e) { return e.time; }).indexOf(d);
      
      
      
      let selectedData = data[index]
      
      if(x(selectedData.time) >= 0 && x(selectedData.time) <= 1130 )
      {
            showAttributes();

            circle.attr("cx", x(selectedData.time))
            .attr("cy", y(selectedData.close))
        
            dashedline.attr("y1", y(selectedData.close) + 5)
            .attr("y2", heightMain)
            .attr("x1", x(selectedData.time))
            .attr("x2", x(selectedData.time))
      
            let tip = "<h3>" + "$" + selectedData.close + "</h3> <h3>" + selectedData.time.getDate()  + "/" + (selectedData.time.getMonth() + 1) + "/" + selectedData.time.getFullYear() + "</h3>";
            tooltip.html(tip).style("left", x(selectedData.time) + marginMain.left - 20 + "px")
            .style("top", y(selectedData.close) - 30 + "px"); 
      }
      else
      {
            hideAttributes();
      }    
 }


 

});


var formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    
      
      minimumFractionDigits: 2
    });


const api_url = "https://api.coindesk.com/v1/bpi/currentprice.json";

async function getDataFromApi(api_url)
{
      const response = await fetch(api_url);

      var data = await response.json();

      const values = Object.keys(data.bpi).map((date) => {
            return {
              date,
              price: data.bpi[date],
            };
      }); 
      
      console.log(values);
          
      let usdValue = formatter.format(values[0].price.rate_float);

      document.getElementById("bitcoin-value").innerHTML = usdValue;
          
      setTimeout(() => getDataFromApi(api_url), 10000)
}

getDataFromApi(api_url);

