


//Instance Methods



isPending: Checks if the transaction is pending.

isWithdrawal: Checks if the transaction is a withdrawal.

canWithdraw: Ensures the withdrawal amount is valid and within limits.

canProcessWithdrawal: Combines multiple conditions to check if a withdrawal can be processed.

markAsCompleted, markAsFailed, markAsCancelled: Mark the transaction status based on admin input or other reasons.



//Static methods


getCompletedTransactions: Fetch all completed transactions.

getPendingWithdrawals: Fetch all pending withdrawals.

getUserTransactions: Fetch all transactions for a specific user.

calculateTotalDeposits and calculateTotalWithdrawals: Calculate the total amount of deposits and withdrawals for a user.

calculatePendingWithdrawals: Calculates the total amount of pending withdrawals.

createTransaction: Simplified static method for creating a new transaction document.


DEPOSIT FLOW-->

[User] 
   ↓
[Clicks "Deposit"]
   ↓
[Choose Method: UPI / Bank / Wallet / Card]
   ↓
[Enter Amount + Optional Note]
   ↓
[Submit Deposit Request]
   ↓
[POST /api/transactions/deposit]
   ↓
[Backend: Validate Amount, Create Transaction]
   ↓
[Status: pending]
   ↓
[Admin or Payment Gateway processes deposit]
   ↓
[If Successful]
     ↓
  Update transaction → status = completed 
     ↓
  Update user → balance += amount
     ↓
  Log mining rate (if applicable)
     ↓
[Show Success Message]
   ↓
[Transaction appears in Deposit History]


 WITHDRAWAL FLOW-->

 [User]
   ↓
[Clicks "Withdraw"]
   ↓
[Select Account (From activeAccounts)]
   ↓
[Enter Amount + Optional Note]
   ↓
[Check: Amount ≤ withdrawableAmount]
   ↓
[Submit Withdrawal Request]
   ↓
[POST /api/transactions/withdraw]
   ↓
[Backend: Validate, Create Transaction]
   ↓
[Status: pending]
   ↓
[Admin manually verifies OR auto-process]
   ↓
[If Successful]
     ↓
  Deduct tax (optional)
     ↓
  Update transaction → status = completed
     ↓
  Update user → balance -= amount
     ↓
[Show Success Message]
   ↓
[Transaction appears in Withdrawal History]

