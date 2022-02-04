import React, { FC } from "react";
import "./ErrorBlock.css";
import { useDeskproAppTheme } from "@deskpro/app-sdk";

export interface ErrorBlockProps {
  errors: string[],
}

export const ErrorBlock: FC<ErrorBlockProps> = ({ errors }: ErrorBlockProps) => {
  const { theme } = useDeskproAppTheme();

  return (
    <div className="error-block" style={{ backgroundColor: theme.colors.red100 }}>
      {errors.map((error, idx) => (
        <div className="error-block-msg" key={idx}>
          {error}
        </div>
      ))}
    </div>
  );
};
