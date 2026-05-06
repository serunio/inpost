import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import styles from './Legend.module.css'

type LegendProps = {
  thresholds: number[];
  colors: string[];
  denominator: null | 'ludnosc' | 'powierzchnia'
};

export function Legend({ thresholds, colors, denominator }: LegendProps) {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div", `${styles.info} ${styles.legend}`);

      const labels: string[] = [];

      for (let i = 0; i < thresholds.length; i++) {
        const from = i === 0 ? 0 : denominator === null ? thresholds[i-1] : thresholds[i-1].toFixed(2)
        const to = denominator === null ? thresholds[i] : thresholds[i].toFixed(2);

        labels.push(
          `<div>
            <i style="background:${colors[i]};"></i>
            ${from} – ${to}
          </div>`
        );
      }

      // ostatni przedział
      const lastThreshold = denominator === null ? thresholds[thresholds.length - 1] : thresholds[thresholds.length - 1].toFixed(2)
      labels.push(
        `<div>
          <i style="background:${colors[colors.length - 1]};"></i>
          ${lastThreshold}+
        </div>`
      );

      const title = denominator === 'ludnosc' ? 'Paczkomaty na 1000 osób' : denominator === 'powierzchnia' ? 'Paczkomaty na 100km^2' : 'Paczkomaty'
      const titleElem = `<h3>${title}</h3>`

      div.innerHTML = [titleElem, ...labels].join("");
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map, thresholds, colors, denominator]);

  return null;
}