import React from 'react'
import Chart from 'react-apexcharts'
import { Card, CardHeader, CardBody } from './TailAdminComponents'

// Line Chart Component
export const LineChart = ({ title, series, categories, height = 300 }) => {
  const options = {
    chart: {
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: false,
      },
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    xaxis: {
      categories: categories || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
      },
    },
    colors: ['#0ea5e9'],
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        opacityFrom: 0.1,
        opacityTo: 0,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-dark-900">{title}</h3>
      </CardHeader>
      <CardBody>
        <Chart type="line" series={series} options={options} height={height} />
      </CardBody>
    </Card>
  )
}

// Bar Chart Component
export const BarChart = ({ title, series, categories, height = 300 }) => {
  const options = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    xaxis: {
      categories: categories || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
      },
    },
    colors: ['#0ea5e9', '#10b981', '#f59e0b'],
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: '55%',
        dataLabels: {
          position: 'top',
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-dark-900">{title}</h3>
      </CardHeader>
      <CardBody>
        <Chart type="bar" series={series} options={options} height={height} />
      </CardBody>
    </Card>
  )
}

// Pie Chart Component
export const PieChart = ({ title, series, labels, height = 300, colors }) => {
  const options = {
    chart: {
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    labels: labels || [],
    colors: colors || ['#FF5733', '#FFC300', '#FF33FF', '#8B5CF6', '#0EA5E9'],
    stroke: {
      show: true,
      width: 4,
      colors: ['#fff']
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        return opts.w.config.series[opts.seriesIndex]
      },
      dropShadow: {
        enabled: false,
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        padding: 4,
        borderRadius: 4,
        borderWidth: 0,
        opacity: 0.9,
      }
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: undefined, // optional, if not defined - uses the opposite shade
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
        colorStops: []
      }
    },
    legend: {
      show: true,
      position: 'left',
      verticalAlign: 'middle',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      labels: {
        colors: '#64748b',
      },
      markers: {
        width: 12,
        height: 12,
        radius: 4,
        offsetX: -6
      },
      itemMargin: {
        horizontal: 0,
        vertical: 12
      },
      containerMargin: {
        left: 20,
        right: 0
      }
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        startAngle: 0,
        endAngle: 360,
        offsetX: 40,
        donut: {
          size: '75%',
          borderRadius: 10,
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              offsetY: 10,
              formatter: (val) => val
            },
            total: {
              show: true,
              label: 'Projects',
              fontSize: '12px',
              fontWeight: 500,
              color: '#64748b',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              }
            }
          }
        },
        customScale: 0.9,
      },
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom'
        }
      }
    }]
  }

  return (
    <Card className="h-full">
      {title && (
        <CardHeader>
          <h3 className="text-base font-semibold text-dark-900">{title}</h3>
        </CardHeader>
      )}
      <CardBody className="flex justify-center">
        <div className="w-full">
          <Chart type="donut" series={series} options={options} height={height} />
        </div>
      </CardBody>
    </Card>
  )
}

// Area Chart Component
export const AreaChart = ({ title, series, categories, height = 300 }) => {
  const options = {
    chart: {
      type: 'area',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: false,
      },
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    xaxis: {
      categories: categories || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
      },
    },
    colors: ['#0ea5e9'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        opacityFrom: 0.6,
        opacityTo: 0,
      },
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-dark-900">{title}</h3>
      </CardHeader>
      <CardBody>
        <Chart type="area" series={series} options={options} height={height} />
      </CardBody>
    </Card>
  )
}

// Pareto Chart Component
export const ParetoChart = ({ title, data = [], height = 350 }) => {
  // Sort data in descending order by value
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const labels = sortedData.map(d => d.label);
  const values = sortedData.map(d => d.value);
  
  // Calculate cumulative percentages
  const total = values.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const cumulativePercentages = values.map(v => {
    cumulative += v;
    return total === 0 ? 0 : Math.round((cumulative / total) * 100);
  });

  const series = [
    {
      name: 'Issues',
      type: 'column',
      data: values
    },
    {
      name: 'Cumulative %',
      type: 'line',
      data: cumulativePercentages
    }
  ];

  const options = {
    chart: {
      height: height,
      type: 'line',
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, sans-serif'
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth'
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1],
      formatter: (val) => `${val}%`,
      offsetY: -10,
      style: {
        fontSize: '12px',
        colors: ['#10b981']
      }
    },
    labels: labels,
    colors: ['#cb0c9f', '#10b981'],
    yaxis: [
      {
        title: {
          text: 'Number of Issues',
          style: {
            color: '#cb0c9f',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            colors: '#cb0c9f'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Cumulative Percentage',
          style: {
            color: '#10b981',
            fontWeight: 600
          }
        },
        max: 100,
        min: 0,
        labels: {
          formatter: (val) => `${val}%`,
          style: {
            colors: '#10b981'
          }
        }
      }
    ],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'light',
      y: {
        formatter: (y, { seriesIndex }) => {
          if (seriesIndex === 1) return `${y}%`;
          return `${y} issues`;
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500
    },
    grid: {
      borderColor: '#f1f5f9'
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-dark-900">{title}</h3>
      </CardHeader>
      <CardBody>
        <div className="w-full">
          <Chart options={options} series={series} type="line" height={height} />
        </div>
      </CardBody>
    </Card>
  );
};
