import { useState, useEffect } from "react";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Header } from "@/components/Header";
import { TopBanner } from "@/components/TopBanner";

import { MODULE_ADDRESS } from "./constants";
import { aptosClient } from "./utils/aptosClient";
import "./hacker-theme.css"; // Import the CSS file

type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};

const moduleAddress = MODULE_ADDRESS;

// Simple Header Component using existing styles
const SimpleHeader = () => {
  return (
    <div className="terminal-window" style={{ marginBottom: "20px", padding: "15px" }}>
      <div className="text-center">
        <span className="glitch" data-text="APTOS BLOCKCHAIN TODO">
          APTOS BLOCKCHAIN TODO
        </span>
        <div style={{ color: "#00ff41", fontSize: "14px", marginTop: "10px" }}>
          &gt; Decentralized Task Management System
        </div>
      </div>
    </div>
  );
};

// Simple Footer Component using existing styles
const SimpleFooter = () => {
  return (
    <div className="terminal-window" style={{ marginTop: "40px", padding: "20px" }}>
      <div className="text-center" style={{ color: "#006600" }}>
        <div style={{ marginBottom: "10px" }}>
          &gt; Powered by Aptos Blockchain | Secure | Decentralized | Immutable
        </div>
        <div className="typing-effect">System Status: OPERATIONAL | Network: APTOS TESTNET</div>
      </div>

      <div className="terminal-window" style={{ marginTop: "40px", padding: "20px" }}>
        <div className="text-center" style={{ color: "#00ff41" }}>
          <div style={{ marginTop: "15px", fontStyle: "italic", color: "#006600" }}>
            &gt; Made with ❤️ by <strong>Tejas Salvi</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");

  const fetchList = async () => {
    if (!account) return [];
    try {
      const todoListResource = await aptosClient().getAccountResource({
        accountAddress: account?.address,
        resourceType: `${moduleAddress}::todolist::TodoList`,
      });
      setAccountHasList(true);

      // tasks table handle
      const tableHandle = (todoListResource as any).tasks.handle;
      // tasks table counter
      const taskCounter = (todoListResource as any).task_counter;

      let tasks = [];
      let counter = 1;
      while (counter <= taskCounter) {
        const tableItem = {
          key_type: "u64",
          value_type: `${moduleAddress}::todolist::Task`,
          key: `${counter}`,
        };
        const task = await aptosClient().getTableItem<Task>({ handle: tableHandle, data: tableItem });
        tasks.push(task);
        counter++;
      }
      // set tasks in local state
      setTasks(tasks);
    } catch (e: any) {
      setAccountHasList(false);
    }
  };

  const addNewList = async () => {
    if (!account) return [];
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::create_list`,
        functionArguments: [],
      },
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onTaskAdded = async () => {
    // check for connected account
    if (!account) return;
    if (!newTask.trim()) return; // Don't add empty tasks

    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::create_task`,
        functionArguments: [newTask],
      },
    };

    // hold the latest task.task_id from our local state
    const latestId = tasks.length > 0 ? parseInt(tasks[tasks.length - 1].task_id) + 1 : 1;

    // build a newTaskToPush object into our local state
    const newTaskToPush: Task = {
      address: account.address.toString(),
      completed: false,
      content: newTask,
      task_id: latestId + "",
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptosClient().waitForTransaction({ transactionHash: response.hash });

      // Create a new array based on current state:
      let newTasks = [...tasks];

      // Add item to the tasks array
      newTasks.push(newTaskToPush);
      // Set state
      setTasks(newTasks);
      // clear input text
      setNewTask("");
    } catch (error: any) {
      console.log("error", error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onCheckboxChange = async (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    if (!account) return;
    if (!event.target.checked) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::complete_task`,
        functionArguments: [taskId],
      },
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptosClient().waitForTransaction({ transactionHash: response.hash });

      setTasks((prevState) => {
        const newState = prevState.map((obj) => {
          // if task_id equals the checked taskId, update completed property
          if (obj.task_id === taskId) {
            return { ...obj, completed: true };
          }

          // otherwise return object as is
          return obj;
        });

        return newState;
      });
    } catch (error: any) {
      console.log("error", error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !transactionInProgress) {
      onTaskAdded();
    }
  };

  useEffect(() => {
    fetchList();
  }, [account?.address]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer); // Cleanup
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(); // e.g., 12:34:56 PM
  };

  return (
    <div className="hacker-container">
      <TopBanner />
      <Header />
      <SimpleHeader />

      <div className="terminal-window">
        <div className="terminal-header">
          <span className="glitch" data-text="APTOS TODO DAPP">
            APTOS TODO DAPP
          </span>{" "}
          - v1.0.0
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#00ff41",
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: "10px",
              textAlign: "right",
              borderTop: "1px solid #004d00",
              paddingTop: "8px",
            }}
          >
            ⏰ {formatTime(currentTime)}
          </div>{" "}
        </div>

        <div className="flex-col items-center justify-center">
          {!accountHasList ? (
            <div className="text-center">
              <div style={{ marginBottom: "20px", color: "#00ff41" }}>
                <span className="typing-effect">&gt; Initialize blockchain todo list...</span>
              </div>
              <button onClick={addNewList} disabled={transactionInProgress} className="hacker-btn">
                {transactionInProgress && <span className="loading-spinner"></span>}
                {transactionInProgress ? "INITIALIZING..." : "ADD NEW LIST"}
              </button>
            </div>
          ) : (
            <div className="flex-col gap-10" style={{ width: "100%" }}>
              <div className="flex-row gap-10">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter new task..."
                  className="hacker-input"
                  disabled={transactionInProgress}
                />
                <button
                  onClick={onTaskAdded}
                  disabled={transactionInProgress || !newTask.trim()}
                  className="hacker-btn"
                  style={{ minWidth: "200px" }}
                >
                  {transactionInProgress && <span className="loading-spinner"></span>}
                  {transactionInProgress ? "EXECUTING..." : "ADD TASK"}
                </button>
              </div>

              {tasks && tasks.length > 0 ? (
                <div>
                  <h3 style={{ color: "#00ff41", marginBottom: "20px", textAlign: "center" }}>
                    &gt; ACTIVE TASKS [{tasks.length}]
                  </h3>
                  {tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className={`task-item ${task.completed ? "completed" : ""} flex-row justify-between items-center`}
                    >
                      <p className="task-content">
                        #{task.task_id}: {task.content}
                      </p>
                      <div>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          disabled={task.completed || transactionInProgress}
                          onChange={(event) => onCheckboxChange(event, task.task_id)}
                          className="task-checkbox"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center" style={{ color: "#006600", fontStyle: "italic", marginTop: "40px" }}>
                  &gt; No tasks found. Add your first task above.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
}

export default App;
