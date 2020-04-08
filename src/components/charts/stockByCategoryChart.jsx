import React, { Component } from "react";
import Chart from "react-apexcharts";
import { apiUrl } from "../../utils/api-config";
import http from "../../services/httpService";
import { cahrtColors } from "../../utils/chartsData";

class StockByCategoryChart extends Component {
  state = {
    options: {
      legend: {
        position: "right",
        fontSize: this.props.width ? "8px" : "20px"
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                fontSize: this.props.width ? "8px" : "20px",
                offsetY: 10
              },
              value : {
                show: true,
                fontSize: this.props.width ? "8px" : "20px",
                offsetY: -2
              }
            }
          }
        }
      },
      tooltip: {
        enabled: false
      },
      colors: cahrtColors,
      dataLabels: {
        formatter: function (val, opts){
          return opts.w.config.series[opts.seriesIndex]
        }
      }
    },
    series: []
  };

  getFirstPageItems = () => {    
    http
      .get(`${apiUrl}/api/v1/items`, { params: { page: 1 } })
      .then(res => {

        this.setState({ allItems: { items: [...res.data.items], page: res.data.page, totalPages: res.data.pages } }, () => this.getAllItems(2) )
      })
      .catch(error => console.log("Error: ", error));
  }

  getAllItems = async (page) => {
    
    let response;

    let allPages = this.state.allItems.totalPages

    while ( page < allPages ) {

      response = await http.get(`${apiUrl}/api/v1/items`, { params: { page } })
    
      page = page+1;
      this.setState({ allItems: { items: [ ...this.state.allItems.items , ...response.data.items] } } )
    }
    response = await http.get(`${apiUrl}/api/v1/items`, { params: { page } })
    this.setState({ allItems: { items: [ ...this.state.allItems.items , ...response.data.items] } }, () => this.mapCategoryName() )
  }

  mapCategoryName = async () => {
    let response;
    let categoryNames = [];

    response = await http.get(`${apiUrl}/api/v1/categories`)
    categoryNames = response.data.map( category => category.name)
    this.setState({categoryNames, categories: response.data}, () => this.setGraph())
  }

  setGraph = () => {
    let i;
    let total;
    let categoryQuantity = []
    for ( i = 0 ;i < this.state.categoryNames.length; i++) {
      total = 0;
      this.state.allItems.items.map( item => { 
        
        if (this.state.categoryNames[i] === item.category) {
          
          item.item_sizes_attributes.forEach(item_size => {
            total = total + item_size.quantity
          })
        }
        this.state.categories[i].children.forEach( child => {
          if (child.name === item.category) {
            item.item_sizes_attributes.forEach(item_size => {
              total = total + item_size.quantity
            })
          }
        })
      });
      categoryQuantity.push(total)
    }
    const options = {}
    options.labels = this.state.categoryNames.map(name => name);
    this.setState({ options, series: categoryQuantity })
  }



  componentDidMount() {
    
    this.getFirstPageItems()
  }
  render() {
    return (
      <Chart
        options={this.state.options}
        series={this.state.series}
        type="donut"
        width="100%"
      />
    );
  }
}
 
export default StockByCategoryChart;
