from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance_tracker.db'
db = SQLAlchemy(app)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    date = datetime.strptime(request.form['date'], '%Y-%m-%d')
    category = request.form['category']
    amount = float(request.form['amount'])
    transaction_type = request.form['type']
    
    new_transaction = Transaction(date=date, category=category, amount=amount, transaction_type=transaction_type)
    db.session.add(new_transaction)
    db.session.commit()
    
    return redirect(url_for('index'))

@app.route('/get_transactions')
def get_transactions():
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return jsonify([
        {
            'id': t.id,
            'date': t.date.strftime('%Y-%m-%d'),
            'category': t.category,
            'amount': t.amount,
            'type': t.transaction_type
        } for t in transactions
    ])

@app.route('/get_summary')
def get_summary():
    income = db.session.query(db.func.sum(Transaction.amount)).filter_by(transaction_type='income').scalar() or 0
    expenses = db.session.query(db.func.sum(Transaction.amount)).filter_by(transaction_type='expense').scalar() or 0
    balance = income - expenses
    
    category_expenses = db.session.query(Transaction.category, db.func.sum(Transaction.amount)).\
        filter_by(transaction_type='expense').group_by(Transaction.category).all()
    
    return jsonify({
        'income': income,
        'expenses': expenses,
        'balance': balance,
        'category_expenses': dict(category_expenses)
    })

@app.route('/update_transaction/<int:id>', methods=['PUT'])
def update_transaction(id):
    data = request.get_json()
    transaction = Transaction.query.get_or_404(id)
    
    transaction.date = datetime.strptime(data['date'], '%Y-%m-%d')
    transaction.category = data['category']
    transaction.amount = data['amount']
    transaction.transaction_type = data['type']
    
    db.session.commit()
    return jsonify({'message': 'Transaction updated successfully!'})

@app.route('/delete_transaction/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted successfully!'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)