var budgetController = (function () {
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function (totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round(this.value / totalIncome * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function () {
        return this.percentage;
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    function calculateTotal(type) {
        var sum = 0;
        data.allItems[type].forEach(function (current, index, array) {
            sum += current.value;
        });

        data.totals[type] = sum;
    }

    return {
        addItem: function (type, description, value) {
            var id, newItem;

            // create new ID based on previous item id
            if (data.allItems[type].length > 0) {
                id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                id = 0;
            }

            // create new item based on 'inc' or 'exp' type
            if (type === 'exp') {
                newItem = new Expense(id, description, value);
            } else {
                newItem = new Income(id, description, value);
            }

            // push it into our data structure
            data.allItems[type].push(newItem);

            // return the new element
            return newItem;
        },
        deleteItem: function (type, id) {
            var ids, index;

            ids = data.allItems[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },
        calculateBudget: function () {
            // calculate total income and expenses
            calculateTotal('inc');
            calculateTotal('exp');

            // calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // calculate the percentage of income that we spent
            if (data.totals.inc > 0) {
                // for example: expanse = 100, income 300, spent 33.333% = 100 / 300 = 0.333 * 100
                data.percentage = Math.round(data.totals.exp / data.totals.inc * 100);
            } else {
                data.percentage = -1;
            }
        },
        calculatePercentages: function () {
            data.allItems.exp.forEach(function (current) {
                current.calcPercentage(data.totals.inc);
            });
        },
        getPercentages: function () {
            // return all percentages
            return data.allItems.exp.map(function (current) {
                return current.getPercentage();
            });
        },
        getBudget: function () {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        }
    }
})();

var UIController = (function () {
    var DOMstrings = {
        inputType: '.js-type-checkbox',
        inputDescription: '.js-add__input_description',
        inputValue: '.js-add__input_value',
        inputButton: '.js-add__input_btn',
        listContainer: '.js-list',
        budgetLabel: '.js-summary__budget',
        incomeLabel: '.js-panel__value_income',
        expensesLabel: '.js-panel__value_expenses',
        percentageLabel: '.js-panel__percentage',
        container: '.js-container',
        expensesPercentageLabel: '.js-item__percentage',
        dateLabel: '.js-summary__month'
    };

    function formatNumber(num, type) {
        var sign;

        num = Math.abs(num);
        num = num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        type === 'exp' ? sign = '-' : sign = '+';

        return `${sign} ${num}`;
    }

    function nodeListForEach(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    }

    return {
        getInput: function () {
            return {
                // will be either inc or exp
                checked: document.querySelector(DOMstrings.inputType).checked,
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            }
        },
        getDOMstrings: function () {
            return DOMstrings;
        },
        addListItem: function (obj, type) {
            var html;

            // create html string with placeholder text
            if (type === 'inc') {
                html = `<div class="item" id="inc-%id%">
                            <p class="item__description">
                                %description%
                            </p>
                            <div class="item__data">
                                <div class="item__values_inc">
                                    <p class="item__value">
                                        %value%
                                    </p>
                                </div>
                                <button class="btn item__btn">
                                    <i class="icon ion-ios-close-circle-outline"></i>
                                </button>
                            </div>
                        </div>`;
            } else if (type === 'exp') {
                html = `<div class="item" id="exp-%id%">
                            <p class="item__description">
                                %description%
                            </p>
                            <div class="item__data">
                                <div class="item__values_exp">
                                    <p class="item__value">
                                        %value%
                                    </p>
                                    <p class="item__percentage js-item__percentage">
                                        15%
                                    </p>
                                </div>
                                <button class="btn item__btn">
                                    <i class="icon ion-ios-close-circle-outline"></i>
                                </button>
                            </div>
                        </div>`;
            }

            // replace the placeholder text with some actual data
            html = html.replace('%id%', obj.id)
                .replace('%description%', obj.description)
                .replace('%value%', formatNumber(obj.value));

            // insert html into the DOM
            document.querySelector(DOMstrings.listContainer).insertAdjacentHTML('beforeend', html);
        },
        deleteListItem: function (selectorId) {
            var element = document.getElementById(selectorId);
            element.parentNode.removeChild(element);
        },
        clearFields: function () {
            var fields = document.querySelectorAll(`${DOMstrings.inputDescription}, ${DOMstrings.inputValue}`);

            // convert fields list to array
            fields = Array.prototype.slice.call(fields);

            fields.forEach(function (element, index, array) {
                element.value = '';
            });

            // make focus on a description field
            fields[0].focus();
        },
        displayBudget: function (obj) {
            var type = obj.budget > 0 ? 'inc' : 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = `${obj.percentage}%`;
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },
        displayPercentages: function (percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercentageLabel);

            nodeListForEach(fields, function (current, index) {
                if (percentages[index] > 0) {
                    current.textContent = `${percentages[index]}%`;
                } else {
                    current.textContent = '---';
                }
            });
        },
        displayDate: function () {
            var now, months;

            now = new Date();
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            document.querySelector(DOMstrings.dateLabel).textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
        },
        typeChanged: function (event) {
            var fields = document.querySelectorAll(`${DOMstrings.inputDescription}, ${DOMstrings.inputValue}`);
            nodeListForEach(fields, function (current) {
                current.classList.toggle('exp');
            });

            document.querySelector(DOMstrings.inputButton).classList.toggle('btn-exp');
        }
    }
})();

var appController = (function (budgetCtrl, UICtrl) {
    function setupEventListeners() {
        // button click handler
        document.querySelector(UICtrl.getDOMstrings().inputButton).addEventListener('click', function (event) {
            addItem();
        });

        // enter key handler
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.repeat) {
                addItem();
            }
        });

        document.querySelector(UICtrl.getDOMstrings().container).addEventListener('click', deleteItem);

        document.querySelector(UICtrl.getDOMstrings().inputType).addEventListener('change', UICtrl.typeChanged);
    }

    function addItem() {
        var input, newItem, type;

        // get the field input data
        input = UICtrl.getInput();

        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            // add the item to the budget controller
            type = input.checked ? 'exp' : 'inc';
            newItem = budgetCtrl.addItem(type, input.description, input.value);

            // add the item to the ui
            UICtrl.addListItem(newItem, type);

            // clear ui inputs
            UICtrl.clearFields();

            // calculate and update budget
            updateBudget();

            // calculate and update percentages
            updatePercentages();
        }
    }

    function deleteItem(event) {
        var itemId, type, id;

        event.stopPropagation();

        // shame...
        itemId = event.target.parentNode.parentNode.parentNode.id;

        if (itemId) {
            splitId = itemId.split('-');
            type = splitId[0];
            id = parseInt(splitId[1]);

            // delete item from data structure
            budgetCtrl.deleteItem(type, id);

            // delete item from ui
            UICtrl.deleteListItem(itemId);

            // update and show new budget
            updateBudget();

            // calculate and update percentages
            updatePercentages();
        }
    }

    function updateBudget() {
        var budget;

        // calculate the budget
        budgetCtrl.calculateBudget();

        // return the budget
        budget = budgetCtrl.getBudget();

        // display the budget on ui
        UICtrl.displayBudget(budget);
    }

    function updatePercentages() {
        // calculate percentages
        budgetCtrl.calculatePercentages();

        // read percentages from budget controller
        var percentages = budgetCtrl.getPercentages();

        // update ui with the new percentages
        UICtrl.displayPercentages(percentages);
    }

    return {
        init: function () {
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            UICtrl.displayDate();
            setupEventListeners();
        }
    }
})(budgetController, UIController);

appController.init();