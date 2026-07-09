import { useState } from "react";
import styles from "./LoginInput.module.css";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  placeholder: string;
  onChange: (value: string) => void;
  onChangeRedefineMessage: (value: string) => void;
  value: string;
  icon: React.ReactNode;
  isSensitive: boolean;
};

function LoginAndSignUpInput({
  placeholder,
  onChange,
  onChangeRedefineMessage,
  value,
  icon,
  isSensitive,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className={styles.box}>
        <div className={styles.icon}>{icon}</div>

        <input
          className={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            onChangeRedefineMessage("");
          }}
          type={isSensitive ? (showPassword ? "text" : "password") : "text"}
        />
        {isSensitive &&
          (showPassword ? (
            <Eye
              size={15}
              onClick={() => {
                setShowPassword(false);
              }}
            ></Eye>
          ) : (
            <EyeOff size={15} onClick={() => setShowPassword(true)}></EyeOff>
          ))}
      </div>
    </>
  );
}

export default LoginAndSignUpInput;
