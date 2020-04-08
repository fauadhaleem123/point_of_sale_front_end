import React, { Component } from "react";
import Chart from "react-apexcharts";
import { apiUrl } from "../../utils/api-config";
import { cahrtColors } from "../../utils/chartsData";
import http from "../../services/httpService";
 
class SalesByCategoryChart extends Component {
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

  setGraph = () => {
    let i;
    let total;
    let categoryQuantity = []

    for ( i = 0 ;i < this.state.categoryNames.length; i++) {
      total = 0;
      this.state.soldItems.map( item => { 
        
        if (this.state.categoryNames[i] === item.category) {   
          total = total + Math.floor(item.quantity)
        }
        this.state.categories[i].children.forEach( child => {
          if (child.name === item.category) {
              total = total + Math.floor(item.quantity)
          }
        })
      });
      categoryQuantity.push(total)
    }
    const options = {}
    options.labels = this.state.categoryNames.map(name => name);
    this.setState({ options, series: categoryQuantity })
  }

  mapCategoryName = async () => {
    let response;
    let categoryNames = [];

    response = await http.get(`${apiUrl}/api/v1/categories`)
  
    categoryNames = response.data.map( category => category.name)
    this.setState({categoryNames, categories: response.data}, () => this.setGraph())
  }

  componentDidMount() {
    http
      .get(`${apiUrl}/api/v1/items/solditems`)
      .then( response => {
        this.setState({ soldItems: response.data.soldItem })
        this.mapCategoryName()
      })
      .catch(error => console.log(error));
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

export default SalesByCategoryChart;
 