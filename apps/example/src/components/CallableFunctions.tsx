import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Card, CardContent, CardTitle, CardDescription } from "../common/Card";

export const CallableFunctions = () => {
  const [count, setCount] = useState(10);
  const [numberValue, setNumberValue] = useState(42);
  const [multipleValues, setMultipleValues] = useState("1,2,3");

  const numbersWithStats = useQuery(api.callableFunctions.getNumbersWithStats, {
    count,
  });
  const numbersSimple = useQuery(api.callableFunctions.getNumbersSimple, {
    count,
  });

  const addNumberWithValidation = useMutation(
    api.callableFunctions.addNumberWithValidation,
  );
  const addMultipleNumbers = useMutation(
    api.callableFunctions.addMultipleNumbers,
  );
  const addNumberAndCleanup = useMutation(
    api.callableFunctions.addNumberAndCleanup,
  );
  const processNumbers = useAction(api.callableFunctions.processNumbers);

  return (
    <Card>
      <CardTitle>Callable Functions Demo</CardTitle>
      <CardDescription>
        Demonstrates queries, mutations, actions, and internal functions using
        callable helpers
      </CardDescription>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Count:</label>
          <Input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            max={50}
          />
        </div>

        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Query Examples:</h3>
              <div className="text-sm space-y-2">
                {numbersWithStats ? (
                  <div>
                    <p className="font-medium">Numbers with Stats:</p>
                    <p>
                      Numbers: {numbersWithStats.numbers.join(", ") || "None"}
                    </p>
                    <p>Count: {numbersWithStats.stats.count}</p>
                    <p>Sum: {numbersWithStats.stats.sum}</p>
                    <p>Average: {numbersWithStats.stats.average.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Timestamp:{" "}
                      {new Date(
                        numbersWithStats.timestamp,
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading...</p>
                )}

                {numbersSimple ? (
                  <div>
                    <p className="font-medium">Simple Numbers:</p>
                    <p>
                      {numbersSimple.numbers.length > 0
                        ? numbersSimple.numbers.join(", ")
                        : "No numbers"}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading...</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Mutation Examples:</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={numberValue}
                    onChange={(e) => setNumberValue(Number(e.target.value))}
                    placeholder="Number value"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      addNumberWithValidation({ value: numberValue })
                        .then((result) => {
                          alert(
                            `Added! ${result.message}\nStats: ${result.stats.count} total, sum: ${result.stats.sum}`,
                          );
                        })
                        .catch((err) => alert(`Error: ${err.message}`));
                    }}
                  >
                    Add with Validation
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={multipleValues}
                    onChange={(e) => setMultipleValues(e.target.value)}
                    placeholder="Comma-separated numbers (e.g., 1,2,3)"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      const values = multipleValues
                        .split(",")
                        .map((v) => Number(v.trim()))
                        .filter((v) => !isNaN(v));
                      if (values.length === 0) {
                        alert("Please enter valid numbers");
                        return;
                      }
                      addMultipleNumbers({ values })
                        .then((result) => {
                          alert(
                            `Added ${result.added} numbers!\nTotal: ${result.totalNumbers}, Sum: ${result.sum}`,
                          );
                        })
                        .catch((err) => alert(`Error: ${err.message}`));
                    }}
                  >
                    Add Multiple
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={numberValue}
                    onChange={(e) => setNumberValue(Number(e.target.value))}
                    placeholder="Number value"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      addNumberAndCleanup({
                        value: numberValue,
                        cleanupThreshold: 10,
                      })
                        .then((result) => {
                          alert(
                            `Added: ${result.added}, Deleted: ${result.deleted}, Remaining: ${result.remaining}`,
                          );
                        })
                        .catch((err) => alert(`Error: ${err.message}`));
                    }}
                  >
                    Add & Cleanup
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Action Example:</h3>
              <Button
                onClick={() => {
                  processNumbers({ count })
                    .then((result) => {
                      alert(
                        `${result.message}\nCalculated Sum: ${result.calculatedSum}`,
                      );
                    })
                    .catch((err) => alert(`Error: ${err.message}`));
                }}
              >
                Process Numbers (Action)
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
