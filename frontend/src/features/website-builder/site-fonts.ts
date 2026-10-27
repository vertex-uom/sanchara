import { Inter, Lora, Playfair_Display } from "next/font/google";

// Fonts the site font styles use; Lexend is already the app font. Add
// siteFontVariables to a page that shows the font choices.
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const siteFontVariables = `${lora.variable} ${playfair.variable} ${inter.variable}`;
