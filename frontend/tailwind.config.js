export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6FA",
        ink: "#0E1B2C",
        navy: { DEFAULT: "#0B2447", light: "#17386B", dark: "#071A33" },
        sky: { DEFAULT: "#0F6BC8", dark: "#0B52A0", light: "#E4EEFA" },
        gold: "#F2C200",
        flag: "#C8102E",
        mist: "#D9E0EA",
      },
      borderColor: { DEFAULT: "#D9E0EA" },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        serif: ['"Source Serif 4 Variable"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
