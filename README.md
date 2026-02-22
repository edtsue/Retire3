# Financial Planning Tool

A web-based financial planning calculator that helps you project your wealth growth over time.

## What it does:

- **Input your assets**: Enter amounts for Stocks, Cash/CD/Bonds, Retirement, Insurance, and Real Estate
- **Set growth rates**: Input Annual Rate of Return (ARR) for each category
- **Account for inflation**: Automatically adjusts returns for inflation (with warnings for negative real returns)
- **See projections**: View 1, 5, 10, 15, 20, and 25-year projections
- **Interactive chart**: Hover over points to see estimated annual income (4% rule)
- **Asset breakdown**: Visual stacked bar showing the proportion of each asset category

## Features:

- **Preset buttons**: Conservative, Average, and Aggressive growth rates with active indicator
- **Real-time updates**: Total assets and breakdown update as you type
- **Animated summary cards**: Count-up animation for projected total and annual income
- **Smooth chart transitions**: Loading skeleton and animated chart draw-in
- **Toast notifications**: Feedback for presets, resets, downloads, and warnings
- **Mobile-friendly**: Responsive design for phones and tablets
- **Export**: Download chart as PNG with timestamped filename

## How to use:

1. Enter your current age and expected inflation rate
2. Fill in your asset amounts and expected returns
3. Use preset buttons (Conservative/Average/Aggressive) for quick ARR setup
4. Click "Project" to see the chart and summary cards
5. Hover over the chart to see estimated retirement income at each time point

## Files:

- `index.html` - The main webpage structure
- `styles.css` - Styling and responsive design
- `script.js` - Application logic (calculations, charts, animations)
- `README.md` - This file

## Technical details:

- Uses Chart.js for the interactive chart
- Responsive design with breakpoints at 1100px, 700px, 600px, and 430px
- Real-time calculations with debounced input handling
