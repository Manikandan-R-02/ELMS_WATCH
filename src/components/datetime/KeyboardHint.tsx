/** A one-line reminder of a picker panel's keys — arrowing through a grid from a text input isn't
 * something a reader would guess on their own. */
export function KeyboardHint({ text }: Readonly<{ text: string }>) {
  return (
    <p className="mt-2 border-t border-slate-100 pt-2 text-center text-[0.65rem] text-slate-400 dark:border-slate-800 dark:text-slate-500">
      {text}
    </p>
  );
}
