export function JourneySteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav className="journey" aria-label="Comparison progress">
      <ol>{["Upload", "Review", "Compare", "Export"].map((label, index) => (
        <li key={label} aria-current={index + 1 === current ? "step" : undefined} className={index + 1 < current ? "done" : ""}>
          <span aria-hidden="true">{index + 1 < current ? "✓" : index + 1}</span>{label}
        </li>
      ))}</ol>
      <p>{current === 1 ? "Add your files, then choose Read Quotation for each one." : current === 2 ? "Check and confirm each quotation to see your comparison." : "Compare the details below, then use Print / Export PDF to save your report."}</p>
    </nav>
  );
}
