"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ButtonDetails {
  label: string;
  onClick: () => void;
  color?: string;
}

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
  actionChildren?: React.ReactNode;
  primaryButtonDetails?: ButtonDetails;
  secondaryButtonDetails?: ButtonDetails;
}

export default function Modal({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  color,
  children,
  actionChildren,
  primaryButtonDetails,
  secondaryButtonDetails,
}: ModalProps) {
  if (!visible) return null;

  // Resolve color presets or hex/rgb values for the icon container
  const resolvedColor = color || "rgb(59, 130, 246)";
  const isHex = resolvedColor.startsWith("#");
  const isRgbOrHsl = resolvedColor.startsWith("rgb") || resolvedColor.startsWith("hsl");

  let bgStyle = "rgba(59, 130, 246, 0.1)";
  let textStyle = resolvedColor;

  if (isHex) {
    bgStyle = `${resolvedColor}15`;
  } else if (isRgbOrHsl) {
    bgStyle = resolvedColor.replace("rgb(", "rgba(").replace(")", ", 0.1)");
  } else {
    const colorPresets: Record<string, { bg: string; text: string }> = {
      red: { bg: "rgba(239, 68, 68, 0.1)", text: "rgb(239, 68, 68)" },
      blue: { bg: "rgba(59, 130, 246, 0.1)", text: "rgb(59, 130, 246)" },
      green: { bg: "rgba(34, 197, 94, 0.1)", text: "rgb(34, 197, 94)" },
      yellow: { bg: "rgba(234, 179, 8, 0.1)", text: "rgb(234, 179, 8)" },
      orange: { bg: "rgba(249, 115, 22, 0.1)", text: "rgb(249, 115, 22)" },
      purple: { bg: "rgba(168, 85, 247, 0.1)", text: "rgb(168, 85, 247)" },
      gray: { bg: "rgba(107, 114, 128, 0.1)", text: "rgb(107, 114, 128)" },
      indigo: { bg: "rgba(99, 102, 241, 0.1)", text: "rgb(99, 102, 241)" },
    };
    const preset = colorPresets[resolvedColor.toLowerCase()];
    if (preset) {
      bgStyle = preset.bg;
      textStyle = preset.text;
    }
  }

  const iconStyle: React.CSSProperties = {
    backgroundColor: bgStyle,
    color: textStyle,
  };

  // Default button configurations
  const defaultPrimaryButton: ButtonDetails = {
    label: "Confirm",
    onClick: onClose || (() => { }),
    color: "blue",
  };

  const defaultSecondaryButton: ButtonDetails = {
    label: "Cancel",
    onClick: onClose || (() => { }),
    color: "gray",
  };

  const priBtn = primaryButtonDetails || defaultPrimaryButton;
  const secBtn = secondaryButtonDetails || defaultSecondaryButton;

  const getButtonVariant = (colorName: string, isPrimary: boolean): "primary" | "secondary" | "danger" | "success" => {
    const c = colorName.toLowerCase();
    if (isPrimary) {
      if (c === "red") return "danger";
      if (c === "green") return "success";
      return "primary";
    } else {
      return "secondary";
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] transition-all duration-200"
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 min-w-[320px] max-w-[90%] shadow-2xl bg-white dark:bg-primary-800 border border-neutral-200/80 dark:border-primary-700/60 dark:shadow-black/75 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="w-full">
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              {icon && (
                <div
                  className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
                  style={iconStyle}
                >
                  {icon}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
              {children}
            </div>

            {/* Footer */}
            {actionChildren ? (
              <div className="mt-6">
                {actionChildren}
              </div>
            ) : (
              <div className="flex justify-end gap-2.5 mt-6 pt-2">
                <Button
                  type="button"
                  onClick={secBtn.onClick}
                  variant={getButtonVariant(secBtn.color || 'gray', false)}
                >
                  {secBtn.label}
                </Button>
                <Button
                  type="button"
                  onClick={priBtn.onClick}
                  variant={getButtonVariant(priBtn.color || 'blue', true)}
                >
                  {priBtn.label}
                </Button>
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body
  );
}
