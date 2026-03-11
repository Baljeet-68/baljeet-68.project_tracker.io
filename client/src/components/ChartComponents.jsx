import React from 'react'
import Chart from 'react-apexcharts'
import { Card, CardHeader, CardBody } from './TailAdminComponents'

// Line Chart Component - Enhanced
export const LineChart = ({ title, series, categories, height = 300, colors }) => {
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
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 150
        }
      }
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      strokeColors: '#ffffff',
      hover: {
        size: 7,
      }
    },
    grid: {
      show: true,
      borderColor: '#e2e8f0',
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
          offsetX: -5
        },
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
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
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      show: true,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: (val) => `${val.toLocaleString()}`
      },
      x: {
        formatter: (val) => `${val}`
      }
    },
    colors: colors || ['#0ea5e9'],
    stroke: {
      width: 3,
      curve: 'smooth',
      lineCap: 'round'
    },
  }

  const chartContent = <Chart type="line" series={series} options={options} height={height} />

  if (!title) return chartContent;

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50">
      <CardHeader>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </CardHeader>
      <CardBody>
        {chartContent}
      </CardBody>
    </Card>
  )
}

// Bar Chart Component - Enhanced
export const BarChart = ({ title, series, categories, height = 300, colors }) => {
  const options = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 150
        }
      }
    },
    grid: {
      show: true,
      borderColor: '#e2e8f0',
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
        top: 10,
        right: 10,
        bottom: 10,
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
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      show: true,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: (val) => `${val.toLocaleString()}`
      }
    },
    colors: colors || ['#0ea5e9', '#10b981', '#f59e0b'],
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: 'end',
        columnWidth: '65%',
        dataLabels: {
          position: 'top',
        },
        distributed: false
      },
    },
    states: {
      hover: {
        filter: {
          type: 'darken',
          value: 0.15
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.15
        }
      }
    }
  }

  const chartContent = <Chart type="bar" series={series} options={options} height={height} />

  if (!title) return chartContent;

  return (
    <Card className="bg-gradient-to-br from-white to-green-50">
      <CardHeader>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </CardHeader>
      <CardBody>
        {chartContent}
      </CardBody>
    </Card>
  )
}

// Pie Chart Component - Enhanced
export const PieChart = ({ title, series, labels, height = 300, colors }) => {
  const options = {
    chart: {
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800
      }
    },
    labels: labels || [],
    colors: colors || ['#FF5733', '#FFC300', '#FF33FF', '#8B5CF6', '#0EA5E9'],
    stroke: {
      show: true,
      width: 3,
      colors: ['#ffffff']
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: (val) => `${val.toLocaleString()}`
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.3,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 50, 100],
        colorStops: []
      }
    },
    legend: {
      show: true,
      position: 'left',
      verticalAlign: 'middle',
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      labels: {
        colors: '#64748b',
      },
      markers: {
        width: 14,
        height: 14,
        radius: 5,
        offsetX: -8
      },
      itemMargin: {
        horizontal: 5,
        vertical: 14
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
          borderRadius: 12,
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              offsetY: -10,
              color: '#64748b'
            },
            value: {
              show: true,
              fontSize: '26px',
              fontWeight: 700,
              offsetY: 10,
              color: '#1e293b',
              formatter: (val) => val
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 600,
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

  const chartContent = (
    <div className="w-full">
      <Chart type="donut" series={series} options={options} height={height} />
    </div>
  )

  if (!title) return chartContent;

  return (
    <Card className="h-full overflow-visible bg-gradient-to-br from-white to-purple-50">
      <CardHeader>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </CardHeader>
      <CardBody className="flex justify-center overflow-visible">
        <div className="w-full overflow-visible pb-2">
          {chartContent}
        </div>
      </CardBody>
    </Card>
  )
}

// Area Chart Component - Enhanced
export const AreaChart = ({ title, series, categories, height = 300, colors }) => {
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
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      strokeColors: '#ffffff',
      hover: {
        size: 7,
      }
    },
    grid: {
      show: true,
      borderColor: '#e2e8f0',
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
        top: 10,
        right: 10,
        bottom: 10,
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
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      show: true,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: (val) => `${val.toLocaleString()}`
      }
    },
    colors: colors || ['#0ea5e9'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        opacityFrom: 0.7,
        opacityTo: 0.1,
        shadeIntensity: 0.2
      },
    },
    stroke: {
      width: 3,
      curve: 'smooth',
      lineCap: 'round'
    },
  }

  const chartContent = <Chart type="area" series={series} options={options} height={height} />

  if (!title) return chartContent;

  return (
    <Card className="bg-gradient-to-br from-white to-indigo-50">
      <CardHeader>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </CardHeader>
      <CardBody>
        {chartContent}
      </CardBody>
    </Card>
  )
}

// Pareto Chart Component - Enhanced
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
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        speed: 800
      }
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth',
      lineCap: 'round'
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1],
      formatter: (val) => `${val}%`,
      offsetY: -10,
      style: {
        fontSize: '12px',
        fontWeight: 600,
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
            fontWeight: 600,
            fontSize: '12px'
          }
        },
        labels: {
          style: {
            colors: '#cb0c9f',
            fontSize: '12px'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Cumulative Percentage',
          style: {
            color: '#10b981',
            fontWeight: 600,
            fontSize: '12px'
          }
        },
        max: 100,
        min: 0,
        labels: {
          formatter: (val) => `${val}%`,
          style: {
            colors: '#10b981',
            fontSize: '12px'
          }
        }
      }
    ],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: '#64748b'
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
      fontWeight: 600,
      fontSize: '13px',
      labels: {
        colors: '#64748b'
      }
    },
    grid: {
      borderColor: '#e2e8f0'
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '70%'
      }
    }
  };

  return (
    <Card className="h-full bg-gradient-to-br from-white to-pink-50">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </CardHeader>
      <CardBody>
        <div className="w-full">
          <Chart options={options} series={series} type="line" height={height} />
        </div>
      </CardBody>
    </Card>
  );
};
