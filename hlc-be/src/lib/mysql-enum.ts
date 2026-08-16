/** Parse the COLUMN_TYPE form returned by MySQL, such as enum('web','phone'). */
export const parseMysqlEnumValues = (columnType: string): string[] | null => {
  const trimmed = columnType.trim();
  if (!trimmed.toLowerCase().startsWith("enum(") || !trimmed.endsWith(")")) return null;

  const source = trimmed.slice(5, -1);
  const values: string[] = [];
  let index = 0;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (source[index] !== "'") return null;
    index += 1;

    let value = "";
    let closed = false;
    while (index < source.length) {
      const character = source[index];
      if (character === "\\") {
        index += 1;
        if (index >= source.length) return null;
        value += source[index];
        index += 1;
        continue;
      }
      if (character === "'" && source[index + 1] === "'") {
        value += "'";
        index += 2;
        continue;
      }
      if (character === "'") {
        index += 1;
        closed = true;
        break;
      }
      value += character;
      index += 1;
    }
    if (!closed) return null;
    values.push(value);

    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index === source.length) break;
    if (source[index] !== ",") return null;
    index += 1;
  }

  return values.length > 0 ? values : null;
};
