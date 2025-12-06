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
export const PieChart = ({ title, series, labels, height = 300 }) => {
  const options = {
    chart: {
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    labels: labels || [],
    colors: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      markers: {
        size: 4,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
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
        <Chart type="donut" series={series} options={options} height={height} />
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
