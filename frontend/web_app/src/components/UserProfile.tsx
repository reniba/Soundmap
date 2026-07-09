import styles from "./UserProfile.module.css";

type Props = {
  username: string;
};

function UserProfile({ username }: Props) {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.avatar}>{username[0]?.toUpperCase()}</div>
        <div className={styles.text}>{username}</div>
      </div>
    </>
  );
}

export default UserProfile;
