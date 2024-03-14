import React, { CSSProperties, FC } from "react";
import { AnyIcon, Icon } from "@deskpro/deskpro-ui";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import { faMailchimp } from "@fortawesome/free-brands-svg-icons";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import "./ExternalLink.css";

export interface ExternalLinkProps {
  href: string;
  title?: string;
  style?: CSSProperties;
}

export const ExternalLink: FC<ExternalLinkProps> = ({ href, title, style }: ExternalLinkProps) => {
  const { theme } = useDeskproAppTheme();

  return (
    <a className="external-link" href={href} title={title} target="_blank" style={{ backgroundColor: theme.colors.grey10, ...(style ?? {}) }} rel="noopener noreferrer">
      <Icon icon={faMailchimp as AnyIcon} className="external-link-mailchimp-icon" themeColor="grey100" />
      <Icon icon={faExternalLinkAlt as AnyIcon} className="external-link-link-icon" themeColor="brandPrimary" size={10} />
    </a>
  );
};
