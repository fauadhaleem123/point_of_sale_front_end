import React, { Component } from "react";
import Chart from "react-apexcharts";
import { apiUrl } from "../../utils/api-config";
import http from "../../services/httpService";
class ItemsStockChart extends Component {
  state = {
    options: {
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      labels: []
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
    this.setState({ allItems: { items: [ ...this.state.allItems.items , ...response.data.items] } }, () => this.setGraph() )
  }

  setGraph = () => {
    let i;
    let total;
    let productQuantities = []

    const options = {}
      this.state.allItems.items.forEach( item => {
        total = 0;
        item.item_sizes_attributes.forEach(sizes => {
          total = total +sizes.quantity
        })
        productQuantities.push(total)
      })
    options.labels = this.state.allItems.items.map(item => item.name);
    this.setState({ options, series: productQuantities })
  }


  componentDidMount() {
    this.getFirstPageItems();
  }

  render() {
    return (
      <Chart
        options={this.state.options}
        series={[{ name: "Available Stock", data: [...this.state.series]}]}
        type="bar"
        height="300px"
      />
    );
  }
}

export default ItemsStockChart;
